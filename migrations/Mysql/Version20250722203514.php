<?php

declare(strict_types=1);

namespace App\Migrations\Mysql;

use Doctrine\DBAL\Platforms\MySQLPlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250722203514 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '[Mysql] Add `display_mode` column on `koi_search`.';
    }

    public function up(Schema $schema): void
    {
        $this->skipIf(!$this->connection->getDatabasePlatform() instanceof MySQLPlatform, 'Mysql or Mariadb migration only. Skipped.');

        $this->addSql('ALTER TABLE koi_search ADD display_mode VARCHAR(255) DEFAULT \'grid\'');
    }

    public function down(Schema $schema): void
    {
        $this->skipIf(true, 'Always move forward.');
    }
}
