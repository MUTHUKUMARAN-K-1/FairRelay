import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ecology/main.dart';

void main() {
  testWidgets('App should build', (WidgetTester tester) async {
    await tester.pumpWidget(const EcoLogiqApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
