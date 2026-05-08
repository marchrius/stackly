<?php

declare(strict_types=1);

namespace App\Enum\AdvancedItemSearch;

class TypeEnum
{
    public const string TYPE_NAME = 'name';
    public const string TYPE_DATUM = 'datum';
    public const string TYPE_COLLECTION = 'collection';
    public const string TYPE_TAG = 'tag';

    public const array TYPES = [
        self::TYPE_DATUM,
        self::TYPE_NAME,
        self::TYPE_COLLECTION,
        self::TYPE_TAG,
    ];

    public static function getTypeLabels(): array
    {
        return [
            self::TYPE_NAME => 'global.advanced_item_search.type.name',
            self::TYPE_DATUM => 'global.advanced_item_search.type.datum',
            self::TYPE_COLLECTION => 'global.advanced_item_search.type.collection',
            self::TYPE_TAG => 'global.advanced_item_search.type.tag'
        ];
    }
}
