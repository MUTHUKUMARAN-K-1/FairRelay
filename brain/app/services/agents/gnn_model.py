"""
GNN Compatibility Model — Optional PyTorch Geometric Module.

Provides a lightweight Graph Neural Network for shipment compatibility scoring.
Falls back gracefully if PyTorch or PyTorch Geometric is not installed.

This module is OPTIONAL. The CompatibilityAgent uses heuristic scoring
when this module is unavailable.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger("fairrelay.agent.gnn")

# Attempt to import PyTorch and PyG
_TORCH_AVAILABLE = False
_PYG_AVAILABLE = False

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    _TORCH_AVAILABLE = True
except ImportError:
    pass

try:
    from torch_geometric.nn import SAGEConv
    from torch_geometric.data import Data
    _PYG_AVAILABLE = True
except ImportError:
    pass


class GNNCompatibilityModel:
    """
    2-layer GraphSAGE model for edge compatibility prediction.

    Node features: [lat_pickup, lng_pickup, lat_drop, lng_drop,
                     weight, volume, time_center, cargo_encoding]
    Edge features: [haversine_pickup, haversine_drop, time_overlap, cargo_match]

    Output: edge-level compatibility score [0, 1]
    """

    def __init__(self, hidden_dim: int = 32, node_features: int = 10):
        if not _TORCH_AVAILABLE or not _PYG_AVAILABLE:
            raise ImportError(
                "PyTorch and PyTorch Geometric are required for GNN scoring. "
                "Install with: pip install torch torch-geometric"
            )
        self.hidden_dim = hidden_dim
        self.node_features = node_features
        self._build_model()
        self.trained = False

    def _build_model(self):
        """Build the GNN architecture."""

        class EdgePredictor(nn.Module):
            def __init__(self, in_dim, hidden_dim):
                super().__init__()
                self.conv1 = SAGEConv(in_dim, hidden_dim)
                self.conv2 = SAGEConv(hidden_dim, hidden_dim)
                self.edge_mlp = nn.Sequential(
                    nn.Linear(hidden_dim * 2 + 4, hidden_dim),
                    nn.ReLU(),
                    nn.Dropout(0.2),
                    nn.Linear(hidden_dim, 1),
                    nn.Sigmoid(),
                )

            def forward(self, x, edge_index, edge_attr=None):
                h = F.relu(self.conv1(x, edge_index))
                h = F.dropout(h, p=0.2, training=self.training)
                h = self.conv2(h, edge_index)
                return h

            def predict_edges(self, h, edge_index, edge_features):
                src = h[edge_index[0]]
                dst = h[edge_index[1]]
                edge_input = torch.cat([src, dst, edge_features], dim=-1)
                return self.edge_mlp(edge_input).squeeze(-1)

        self.model = EdgePredictor(self.node_features, self.hidden_dim)

    def predict(
        self,
        shipments: List[Dict],
        heuristic_scores: List[Dict],
    ) -> List[float]:
        """
        Predict compatibility scores using GNN.

        Returns list of edge scores aligned with heuristic_scores order.
        """
        if not self.trained:
            logger.warning("[GNN] Model not trained, returning heuristic scores")
            return [e.get("score", 0.5) for e in heuristic_scores]

        # Build graph data
        try:
            data = self._build_graph(shipments, heuristic_scores)
            self.model.eval()
            with torch.no_grad():
                node_emb = self.model(data.x, data.edge_index)
                predictions = self.model.predict_edges(
                    node_emb, data.edge_index, data.edge_attr
                )
            return predictions.tolist()
        except Exception as e:
            logger.error(f"[GNN] Prediction failed: {e}, falling back to heuristic")
            return [e_item.get("score", 0.5) for e_item in heuristic_scores]

    def _build_graph(self, shipments, edges):
        """Convert shipments and edges to PyG Data object."""
        n = len(shipments)
        node_features = []
        for s in shipments:
            cargo_enc = hash(s.get("cargoType", "GENERAL")) % 10 / 10.0
            prio_map = {"LOW": 0.25, "MEDIUM": 0.5, "HIGH": 0.75, "CRITICAL": 1.0}
            prio = prio_map.get(s.get("priority", "MEDIUM"), 0.5)
            node_features.append([
                s["pickupLat"] / 90, s["pickupLng"] / 180,
                s["dropLat"] / 90, s["dropLng"] / 180,
                min(s.get("weight", 10) / 5000, 1.0),
                min(s.get("volume", 0.1) / 20, 1.0),
                s.get("fragility", 0) / 5,
                cargo_enc,
                prio,
                s.get("serviceTimeMinutes", 15) / 120,
            ])

        x = torch.tensor(node_features, dtype=torch.float)

        src_ids, dst_ids, edge_feats = [], [], []
        for e in edges:
            si, di = e["sourceIdx"], e["targetIdx"]
            factors = e.get("factors", {})
            src_ids.extend([si, di])
            dst_ids.extend([di, si])
            feat = [
                factors.get("geo", 0.5),
                factors.get("time", 0.5),
                factors.get("cargo", 0.5),
                factors.get("route", 0.5),
            ]
            edge_feats.extend([feat, feat])

        edge_index = torch.tensor([src_ids, dst_ids], dtype=torch.long)
        edge_attr = torch.tensor(edge_feats, dtype=torch.float) if edge_feats else torch.zeros((0, 4))

        return Data(x=x, edge_index=edge_index, edge_attr=edge_attr)


def is_gnn_available() -> bool:
    """Check if GNN dependencies are installed."""
    return _TORCH_AVAILABLE and _PYG_AVAILABLE
