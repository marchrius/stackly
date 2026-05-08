<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Entity\Loan;
use Zenstruck\Foundry\Persistence\PersistentProxyObjectFactory;

/**
 * @extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory<\App\Entity\Loan>
 */
final class LoanFactory extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory
{
    #[\Override]
    protected function defaults(): array|callable
    {
        return [
            'lentTo' => self::faker()->firstName(),
            'lentAt' => \DateTimeImmutable::createFromMutable(self::faker()->dateTime()),
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
        return Loan::class;
    }
}
