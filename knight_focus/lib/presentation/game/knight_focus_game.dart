import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/providers/pet_bounds_provider.dart';
import '../components/knight_component.dart';

/// Main game widget that wraps the Flame game
class KnightFocusGameWidget extends ConsumerStatefulWidget {
  const KnightFocusGameWidget({super.key});

  @override
  ConsumerState<KnightFocusGameWidget> createState() =>
      _KnightFocusGameWidgetState();
}

class _KnightFocusGameWidgetState extends ConsumerState<KnightFocusGameWidget> {
  late final KnightFocusGame _game;

  @override
  void initState() {
    super.initState();
    _game = KnightFocusGame(
      onBoundsUpdate: (x, y, width, height) {
        ref
            .read(petBoundsProvider.notifier)
            .updateBounds(x.toInt(), y.toInt(), width.toInt(), height.toInt());
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return GameWidget(
      game: _game,
      backgroundBuilder: (context) => Container(
        // Magenta background - this color will be transparent
        color: const Color(0xFFFF00FF),
      ),
    );
  }
}

/// Main Flame game class for the desktop pet overlay
class KnightFocusGame extends FlameGame with HasCollisionDetection {
  final void Function(double x, double y, double width, double height)
  onBoundsUpdate;

  late final KnightComponent knight;

  KnightFocusGame({required this.onBoundsUpdate});

  @override
  Color backgroundColor() => const Color(0xFFFF00FF); // Magenta = transparent

  @override
  Future<void> onLoad() async {
    // Set images prefix to empty because they are not in assets/images/
    images.prefix = '';
    await super.onLoad();

    // Create and add the knight
    knight = KnightComponent(
      onPositionChanged: _handleKnightPositionChange,
      colorVariant: 'Colour1',
      styleVariant: 'Outline',
    );

    // Position at bottom center of screen
    knight.position = Vector2(size.x / 2, size.y - knight.size.y / 2 - 10);

    add(knight);

    // Initial bounds update
    _handleKnightPositionChange(
      knight.position.x - knight.size.x / 2,
      knight.position.y - knight.size.y / 2,
      knight.size.x,
      knight.size.y,
    );
  }

  void _handleKnightPositionChange(
    double x,
    double y,
    double width,
    double height,
  ) {
    onBoundsUpdate(x, y, width, height);
  }

  @override
  void onGameResize(Vector2 size) {
    super.onGameResize(size);

    // Keep knight on screen when window resizes
    if (isLoaded) {
      knight.position = Vector2(
        knight.position.x.clamp(knight.size.x / 2, size.x - knight.size.x / 2),
        knight.position.y.clamp(knight.size.y / 2, size.y - knight.size.y / 2),
      );
    }
  }
}
