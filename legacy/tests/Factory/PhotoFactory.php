<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Entity\Photo;
use App\Enum\VisibilityEnum;
use Zenstruck\Foundry\Persistence\PersistentProxyObjectFactory;

/**
 * @extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory<\App\Entity\Photo>
 */
final class PhotoFactory extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory
{
    #[\Override]
    protected function defaults(): array|callable
    {
        return [
            'title' => self::faker()->text(),
            'visibility' => VisibilityEnum::VISIBILITY_PUBLIC,
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
        return Photo::class;
    }
}
