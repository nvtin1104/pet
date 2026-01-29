import 'package:isar/isar.dart';

part 'pet_settings.g.dart';

@collection
class PetSettings {
  Id id = Isar.autoIncrement;

  String colorVariant = 'Colour1';
  String styleVariant = 'Outline';
  double scale = 1.0;
  int lastPositionX = 0;
  int lastPositionY = 0;
  bool soundEnabled = true;
  bool visible = true;

  PetSettings();

  PetSettings.withDefaults({
    this.colorVariant = 'Colour1',
    this.styleVariant = 'Outline',
    this.scale = 1.0,
    this.lastPositionX = 0,
    this.lastPositionY = 0,
    this.soundEnabled = true,
    this.visible = true,
  });
}
