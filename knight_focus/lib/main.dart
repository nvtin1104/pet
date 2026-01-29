import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/services/settings_service.dart';
import 'presentation/game/knight_focus_game.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize settings service
  await SettingsService.instance.initialize();

  runApp(
    const ProviderScope(
      child: KnightFocusApp(),
    ),
  );
}

class KnightFocusApp extends StatelessWidget {
  const KnightFocusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'KnightFocus',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.deepPurple,
          brightness: Brightness.dark,
        ),
      ),
      home: const KnightFocusScreen(),
    );
  }
}

class KnightFocusScreen extends StatelessWidget {
  const KnightFocusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      // Magenta background - this color is the transparent color key
      // The C++ code makes this color fully transparent
      backgroundColor: Color(0xFFFF00FF),
      body: KnightFocusGameWidget(),
    );
  }
}
