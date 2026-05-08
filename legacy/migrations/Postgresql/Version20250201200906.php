<?php

declare(strict_types=1);

namespace App\Migrations\Postgresql;

use Doctrine\DBAL\Platforms\PostgreSQLPlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250201200906 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '[Postgresql] Add `number_of_results` on `koi_search` table.';
    }

    public function up(Schema $schema): void
    {
        $this->skipIf(!$this->connection->getDatabasePlatform() instanceof PostgreSQLPlatform, 'Postgresql migration only. Skipped.');

        $this->addSql('ALTER TABLE koi_search ADD number_of_results BIGINT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->skipIf(true, 'Always move forward.');
    }
}
