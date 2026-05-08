<?php
declare(strict_types=1);

namespace App\Doctrine\Query\AST\Platform\Functions;

use Doctrine\ORM\Query\AST\Node;
use Doctrine\ORM\Query\SqlWalker;

abstract class PlatformFunctionNode
{
    public array $parameters;

    public function __construct(array $parameters)
    {
        $this->parameters = $parameters;
    }

    abstract public function getSql(SqlWalker $sqlWalker): string;

    protected function getExpressionValue($expression, SqlWalker $sqlWalker): string
    {
        if ($expression instanceof Node) {
            $expression = $expression->dispatch($sqlWalker);
        }

        return $expression;
    }
}