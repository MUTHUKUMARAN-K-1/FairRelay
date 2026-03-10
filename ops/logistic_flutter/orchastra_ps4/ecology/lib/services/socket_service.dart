import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/api_config.dart';

/// Socket Service - Real-time communication
class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;

  IO.Socket? _socket;
  bool _isConnected = false;

  // Event callbacks
  Function(Map<String, dynamic>)? onSynergyProposed;
  Function(Map<String, dynamic>)? onDeliveryUpdate;
  Function(Map<String, dynamic>)? onNotification;
  Function()? onConnected;
  Function()? onDisconnected;
  Function(dynamic)? onError;

  SocketService._internal();

  bool get isConnected => _isConnected;

  /// Connect to socket server
  void connect({String? token, String? userId}) {
    if (_socket != null && _isConnected) return;

    _socket = IO.io(
      ApiConfig.socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionDelay(3000)
          .setReconnectionAttempts(10)
          .setExtraHeaders(
            token != null ? {'Authorization': 'Bearer $token'} : {},
          )
          .build(),
    );

    _setupListeners(userId);
  }

  /// Setup socket event listeners
  void _setupListeners(String? userId) {
    _socket?.onConnect((_) {
      _isConnected = true;
      onConnected?.call();

      // Join user's room for targeted notifications
      if (userId != null) {
        joinRoom(userId);
      }
    });

    _socket?.onDisconnect((_) {
      _isConnected = false;
      onDisconnected?.call();
    });

    _socket?.onConnectError((error) {
      _isConnected = false;
      onError?.call(error);
    });

    _socket?.onError((error) {
      onError?.call(error);
    });

    // Listen for synergy opportunities
    _socket?.on('SYNERGY_PROPOSED', (data) {
      if (data is Map<String, dynamic>) {
        onSynergyProposed?.call(data);
      }
    });

    // Listen for delivery updates
    _socket?.on('DELIVERY_UPDATE', (data) {
      if (data is Map<String, dynamic>) {
        onDeliveryUpdate?.call(data);
      }
    });

    // Listen for notifications
    _socket?.on('NOTIFICATION', (data) {
      if (data is Map<String, dynamic>) {
        onNotification?.call(data);
      }
    });
  }

  /// Join a specific room
  void joinRoom(String roomId) {
    _socket?.emit('join', roomId);
  }

  /// Leave a room
  void leaveRoom(String roomId) {
    _socket?.emit('leave', roomId);
  }

  /// Emit a custom event
  void emit(String event, dynamic data) {
    _socket?.emit(event, data);
  }

  /// Listen to a custom event
  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }

  /// Remove listener for an event
  void off(String event) {
    _socket?.off(event);
  }

  /// Disconnect from socket
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
  }

  /// Dispose resources
  void dispose() {
    disconnect();
  }
}
