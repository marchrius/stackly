<?php

declare(strict_types=1);

namespace App\Doctrine\Query\AST\Platform\Functions\Postgresql;

use App\Doctrine\Query\AST\Platform\Functions\PlatformFunctionNode;
use Doctrine\ORM\Query\AST\Node;
use Doctrine\ORM\Query\SqlWalker;
use App\Doctrine\Query\AST\Functions\Cast as DqlFunction;

class Cast extends PlatformFunctionNode
{
    public function getSql(SqlWalker $sqlWalker): string
    {
        /** @var Node $value */
        $value = $this->parameters[DqlFunction::PARAMETER_KEY];
        $type = $this->parameters[DqlFunction::TYPE_KEY];

        $type = strtolower($type);

        if ($type === 'json') {
            $type = 'jsonb';
        }

        if ($type === 'bool') {
            $type = 'boolean';
        }

        if ($type === 'binary') {
            $type = 'bytea';
        }

        /**
         * The notations varchar(n) and char(n) are aliases for character varying(n) and character(n), respectively.
         * character without length specifier is equivalent to character(1). If character varying is used
         * without length specifier, the type accepts strings of any size. The latter is a PostgreSQL extension.
         * http://www.postgresql.org/docs/9.2/static/datatype-character.html
         */
        if ($type === 'string') {
            $type = 'varchar';
        }

        return 'CAST(' . $this->getExpressionValue($value, $sqlWalker) . ' AS ' . $type . ')';
    }
}
