<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Entity\Search;
use App\Enum\AdvancedItemSearch\TypeEnum;
use Doctrine\Common\Collections\ArrayCollection;
use Zenstruck\Foundry\Persistence\PersistentProxyObjectFactory;

/**
 * @extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory<\App\Entity\Search>
 */
final class SearchFactory extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory
{
    #[\Override]
    public static function class(): string
    {
        return Search::class;
    }

    #[\Override]
    protected function defaults(): array|callable
    {
        return [
            'name' => self::faker()->word(),
            'blocks' => new ArrayCollection(),
        ];
    }

    #[\Override]
    protected function initialize(): static
    {
        return $this;
    }
}
