<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Entity\Datum;
use App\Enum\DatumTypeEnum;
use Zenstruck\Foundry\Persistence\PersistentProxyObjectFactory;

/**
 * @extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory<\App\Entity\Datum>
 */
final class DatumFactory extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory
{
    #[\Override]
    protected function defaults(): array|callable
    {
        return [
            'label' => self::faker()->word(),
            'type' => DatumTypeEnum::TYPE_TEXT,
            'createdAt' => \DateTimeImmutable::createFromMutable(self::faker()->dateTime()),
        ];
    }

    #[\Override]
    protected function initialize(): static
    {
        return $this;
    }

    #[\Override]
    public static function class(): string
    {
        return Datum::class;
    }
}
