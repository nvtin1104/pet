import 'package:flame/components.dart';
import 'package:flame/sprite.dart';
import 'package:flutter/foundation.dart';

/// Available animation types for the Knight
enum KnightAnimationType {
  idle,
  run,
  jump,
  fall,
  crouch,
  crouchWalk,
  attack,
  attack2,
  attackCombo,
  wallClimb,
  wallSlide,
  wallHang,
  death,
  hit,
  roll,
  dash,
  turnAround,
  slide,
}

/// Controls knight sprite animations
class KnightAnimationController {
  final SpriteAnimationComponent component;
  final String colorVariant;
  final String styleVariant;

  final Map<KnightAnimationType, SpriteAnimation> _animations = {};
  KnightAnimationType _currentAnimation = KnightAnimationType.idle;
  bool _isTransitioning = false;

  // Sprite sheet constants
  static const double frameWidth = 120.0;
  static const double frameHeight = 80.0;

  // Animation configuration: (frames count, step time, loops)
  static const Map<KnightAnimationType, (int, double, bool)> _animationConfig =
      {
        KnightAnimationType.idle: (10, 0.1, true),
        KnightAnimationType.run: (10, 0.08, true),
        KnightAnimationType.jump: (3, 0.1, false),
        KnightAnimationType.fall: (3, 0.1, true),
        KnightAnimationType.crouch: (1, 0.1, false),
        KnightAnimationType.crouchWalk: (8, 0.1, true),
        KnightAnimationType.attack: (4, 0.08, false),
        KnightAnimationType.attack2: (6, 0.08, false),
        KnightAnimationType.attackCombo: (10, 0.08, false),
        KnightAnimationType.wallClimb: (6, 0.1, true),
        KnightAnimationType.wallSlide: (3, 0.1, true),
        KnightAnimationType.wallHang: (1, 0.1, false),
        KnightAnimationType.death: (10, 0.1, false),
        KnightAnimationType.hit: (1, 0.2, false),
        KnightAnimationType.roll: (12, 0.06, false),
        KnightAnimationType.dash: (2, 0.1, false),
        KnightAnimationType.turnAround: (3, 0.1, false),
        KnightAnimationType.slide: (2, 0.1, false),
      };

  // Asset file name mapping
  static const Map<KnightAnimationType, String> _animationFiles = {
    KnightAnimationType.idle: '_Idle.png',
    KnightAnimationType.run: '_Run.png',
    KnightAnimationType.jump: '_Jump.png',
    KnightAnimationType.fall: '_Fall.png',
    KnightAnimationType.crouch: '_Crouch.png',
    KnightAnimationType.crouchWalk: '_CrouchWalk.png',
    KnightAnimationType.attack: '_Attack.png',
    KnightAnimationType.attack2: '_Attack2.png',
    KnightAnimationType.attackCombo: '_AttackCombo2hit.png',
    KnightAnimationType.wallClimb: '_WallClimb.png',
    KnightAnimationType.wallSlide: '_WallSlide.png',
    KnightAnimationType.wallHang: '_WallHang.png',
    KnightAnimationType.death: '_Death.png',
    KnightAnimationType.hit: '_Hit.png',
    KnightAnimationType.roll: '_Roll.png',
    KnightAnimationType.dash: '_Dash.png',
    KnightAnimationType.turnAround: '_TurnAround.png',
    KnightAnimationType.slide: '_Slide.png',
  };

  KnightAnimationController({
    required this.component,
    this.colorVariant = 'Colour1',
    this.styleVariant = 'Outline',
  });

  String get _assetBasePath => '$colorVariant/$styleVariant/120x80_PNGSheets/';

  Future<void> loadAnimations() async {
    final game = component.findGame();
    if (game == null) {
      debugPrint('Warning: Game not found for animation loading');
      return;
    }

    for (final type in KnightAnimationType.values) {
      final fileName = _animationFiles[type];
      if (fileName == null) continue;

      final config = _animationConfig[type];
      if (config == null) continue;

      final (frames, stepTime, loops) = config;

      try {
        final image = await game.images.load('$_assetBasePath$fileName');

        final spriteSheet = SpriteSheet(
          image: image,
          srcSize: Vector2(frameWidth, frameHeight),
        );

        _animations[type] = spriteSheet.createAnimation(
          row: 0,
          stepTime: stepTime,
          to: frames,
          loop: loops,
        );
      } catch (e) {
        debugPrint('Failed to load animation $type: $e');
      }
    }
  }

  /// Play an animation by type
  void playAnimation(KnightAnimationType type) {
    if (_currentAnimation == type && !_isTransitioning) return;

    final animation = _animations[type];
    if (animation == null) {
      debugPrint('Animation $type not loaded');
      return;
    }

    _currentAnimation = type;
    _isTransitioning = true;

    component.animation = animation;
    component.animationTicker?.reset();

    _isTransitioning = false;
  }

  /// Update called each frame
  void update(double dt) {
    final ticker = component.animationTicker;
    if (ticker != null && ticker.done()) {
      final config = _animationConfig[_currentAnimation];
      if (config != null && !config.$3) {
        // Non-looping animation finished, return to idle
        playAnimation(KnightAnimationType.idle);
      }
    }
  }

  KnightAnimationType get currentAnimation => _currentAnimation;

  bool get isAnimationLoaded => _animations.isNotEmpty;
}
