// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'pet_settings.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetPetSettingsCollection on Isar {
  IsarCollection<PetSettings> get petSettings => this.collection();
}

const PetSettingsSchema = CollectionSchema(
  name: r'PetSettings',
  id: 3856502886651854886,
  properties: {
    r'colorVariant': PropertySchema(
      id: 0,
      name: r'colorVariant',
      type: IsarType.string,
    ),
    r'lastPositionX': PropertySchema(
      id: 1,
      name: r'lastPositionX',
      type: IsarType.long,
    ),
    r'lastPositionY': PropertySchema(
      id: 2,
      name: r'lastPositionY',
      type: IsarType.long,
    ),
    r'scale': PropertySchema(
      id: 3,
      name: r'scale',
      type: IsarType.double,
    ),
    r'soundEnabled': PropertySchema(
      id: 4,
      name: r'soundEnabled',
      type: IsarType.bool,
    ),
    r'styleVariant': PropertySchema(
      id: 5,
      name: r'styleVariant',
      type: IsarType.string,
    ),
    r'visible': PropertySchema(
      id: 6,
      name: r'visible',
      type: IsarType.bool,
    )
  },
  estimateSize: _petSettingsEstimateSize,
  serialize: _petSettingsSerialize,
  deserialize: _petSettingsDeserialize,
  deserializeProp: _petSettingsDeserializeProp,
  idName: r'id',
  indexes: {},
  links: {},
  embeddedSchemas: {},
  getId: _petSettingsGetId,
  getLinks: _petSettingsGetLinks,
  attach: _petSettingsAttach,
  version: '3.1.0+1',
);

int _petSettingsEstimateSize(
  PetSettings object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.colorVariant.length * 3;
  bytesCount += 3 + object.styleVariant.length * 3;
  return bytesCount;
}

void _petSettingsSerialize(
  PetSettings object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.colorVariant);
  writer.writeLong(offsets[1], object.lastPositionX);
  writer.writeLong(offsets[2], object.lastPositionY);
  writer.writeDouble(offsets[3], object.scale);
  writer.writeBool(offsets[4], object.soundEnabled);
  writer.writeString(offsets[5], object.styleVariant);
  writer.writeBool(offsets[6], object.visible);
}

PetSettings _petSettingsDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = PetSettings();
  object.colorVariant = reader.readString(offsets[0]);
  object.id = id;
  object.lastPositionX = reader.readLong(offsets[1]);
  object.lastPositionY = reader.readLong(offsets[2]);
  object.scale = reader.readDouble(offsets[3]);
  object.soundEnabled = reader.readBool(offsets[4]);
  object.styleVariant = reader.readString(offsets[5]);
  object.visible = reader.readBool(offsets[6]);
  return object;
}

P _petSettingsDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readLong(offset)) as P;
    case 2:
      return (reader.readLong(offset)) as P;
    case 3:
      return (reader.readDouble(offset)) as P;
    case 4:
      return (reader.readBool(offset)) as P;
    case 5:
      return (reader.readString(offset)) as P;
    case 6:
      return (reader.readBool(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _petSettingsGetId(PetSettings object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _petSettingsGetLinks(PetSettings object) {
  return [];
}

void _petSettingsAttach(
    IsarCollection<dynamic> col, Id id, PetSettings object) {
  object.id = id;
}

extension PetSettingsQueryWhereSort
    on QueryBuilder<PetSettings, PetSettings, QWhere> {
  QueryBuilder<PetSettings, PetSettings, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension PetSettingsQueryWhere
    on QueryBuilder<PetSettings, PetSettings, QWhereClause> {
  QueryBuilder<PetSettings, PetSettings, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterWhereClause> idNotEqualTo(
      Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterWhereClause> idGreaterThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterWhereClause> idLessThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterWhereClause> idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension PetSettingsQueryFilter
    on QueryBuilder<PetSettings, PetSettings, QFilterCondition> {
  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      colorVariantEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'colorVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      colorVariantGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'colorVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      colorVariantLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'colorVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      colorVariantBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'colorVariant',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      colorVariantStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'colorVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      colorVariantEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'colorVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      colorVariantContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'colorVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      colorVariantMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'colorVariant',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      colorVariantIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'colorVariant',
        value: '',
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      colorVariantIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'colorVariant',
        value: '',
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition> idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition> idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      lastPositionXEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'lastPositionX',
        value: value,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      lastPositionXGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'lastPositionX',
        value: value,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      lastPositionXLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'lastPositionX',
        value: value,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      lastPositionXBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'lastPositionX',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      lastPositionYEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'lastPositionY',
        value: value,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      lastPositionYGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'lastPositionY',
        value: value,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      lastPositionYLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'lastPositionY',
        value: value,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      lastPositionYBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'lastPositionY',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition> scaleEqualTo(
    double value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'scale',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      scaleGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'scale',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition> scaleLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'scale',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition> scaleBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'scale',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      soundEnabledEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'soundEnabled',
        value: value,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      styleVariantEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'styleVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      styleVariantGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'styleVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      styleVariantLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'styleVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      styleVariantBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'styleVariant',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      styleVariantStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'styleVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      styleVariantEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'styleVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      styleVariantContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'styleVariant',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      styleVariantMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'styleVariant',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      styleVariantIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'styleVariant',
        value: '',
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition>
      styleVariantIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'styleVariant',
        value: '',
      ));
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterFilterCondition> visibleEqualTo(
      bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'visible',
        value: value,
      ));
    });
  }
}

extension PetSettingsQueryObject
    on QueryBuilder<PetSettings, PetSettings, QFilterCondition> {}

extension PetSettingsQueryLinks
    on QueryBuilder<PetSettings, PetSettings, QFilterCondition> {}

extension PetSettingsQuerySortBy
    on QueryBuilder<PetSettings, PetSettings, QSortBy> {
  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> sortByColorVariant() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'colorVariant', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy>
      sortByColorVariantDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'colorVariant', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> sortByLastPositionX() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastPositionX', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy>
      sortByLastPositionXDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastPositionX', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> sortByLastPositionY() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastPositionY', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy>
      sortByLastPositionYDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastPositionY', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> sortByScale() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'scale', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> sortByScaleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'scale', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> sortBySoundEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'soundEnabled', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy>
      sortBySoundEnabledDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'soundEnabled', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> sortByStyleVariant() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'styleVariant', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy>
      sortByStyleVariantDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'styleVariant', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> sortByVisible() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'visible', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> sortByVisibleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'visible', Sort.desc);
    });
  }
}

extension PetSettingsQuerySortThenBy
    on QueryBuilder<PetSettings, PetSettings, QSortThenBy> {
  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> thenByColorVariant() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'colorVariant', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy>
      thenByColorVariantDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'colorVariant', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> thenByLastPositionX() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastPositionX', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy>
      thenByLastPositionXDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastPositionX', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> thenByLastPositionY() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastPositionY', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy>
      thenByLastPositionYDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastPositionY', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> thenByScale() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'scale', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> thenByScaleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'scale', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> thenBySoundEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'soundEnabled', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy>
      thenBySoundEnabledDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'soundEnabled', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> thenByStyleVariant() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'styleVariant', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy>
      thenByStyleVariantDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'styleVariant', Sort.desc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> thenByVisible() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'visible', Sort.asc);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QAfterSortBy> thenByVisibleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'visible', Sort.desc);
    });
  }
}

extension PetSettingsQueryWhereDistinct
    on QueryBuilder<PetSettings, PetSettings, QDistinct> {
  QueryBuilder<PetSettings, PetSettings, QDistinct> distinctByColorVariant(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'colorVariant', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QDistinct> distinctByLastPositionX() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastPositionX');
    });
  }

  QueryBuilder<PetSettings, PetSettings, QDistinct> distinctByLastPositionY() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastPositionY');
    });
  }

  QueryBuilder<PetSettings, PetSettings, QDistinct> distinctByScale() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'scale');
    });
  }

  QueryBuilder<PetSettings, PetSettings, QDistinct> distinctBySoundEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'soundEnabled');
    });
  }

  QueryBuilder<PetSettings, PetSettings, QDistinct> distinctByStyleVariant(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'styleVariant', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<PetSettings, PetSettings, QDistinct> distinctByVisible() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'visible');
    });
  }
}

extension PetSettingsQueryProperty
    on QueryBuilder<PetSettings, PetSettings, QQueryProperty> {
  QueryBuilder<PetSettings, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<PetSettings, String, QQueryOperations> colorVariantProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'colorVariant');
    });
  }

  QueryBuilder<PetSettings, int, QQueryOperations> lastPositionXProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastPositionX');
    });
  }

  QueryBuilder<PetSettings, int, QQueryOperations> lastPositionYProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastPositionY');
    });
  }

  QueryBuilder<PetSettings, double, QQueryOperations> scaleProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'scale');
    });
  }

  QueryBuilder<PetSettings, bool, QQueryOperations> soundEnabledProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'soundEnabled');
    });
  }

  QueryBuilder<PetSettings, String, QQueryOperations> styleVariantProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'styleVariant');
    });
  }

  QueryBuilder<PetSettings, bool, QQueryOperations> visibleProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'visible');
    });
  }
}
