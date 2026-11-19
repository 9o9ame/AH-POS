<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/** PostgreSQL NUMERIC math; never use PHP binary floats for document totals. */
final class DocumentMath
{
    public static function line(string $quantity, string $price): string
    {
        return (string) DB::selectOne(
            'SELECT ROUND(CAST(? AS numeric) * CAST(? AS numeric), 4)::numeric(20,4)::text AS amount',
            [$quantity, $price]
        )->amount;
    }

    /** @param list<string> $amounts */
    public static function sum(array $amounts): string
    {
        return (string) DB::selectOne(
            'SELECT COALESCE(SUM(value::numeric), 0)::numeric(20,4)::text AS amount
             FROM jsonb_array_elements_text(CAST(? AS jsonb)) AS value',
            [json_encode($amounts, JSON_THROW_ON_ERROR)]
        )->amount;
    }

    public static function covers(string $paid, string $total): bool
    {
        return (int) DB::selectOne(
            'SELECT CASE WHEN CAST(? AS numeric) >= CAST(? AS numeric) THEN 1 ELSE 0 END AS covers',
            [$paid, $total]
        )->covers === 1;
    }

    public static function change(string $paid, string $total): string
    {
        return (string) DB::selectOne(
            'SELECT (CAST(? AS numeric) - CAST(? AS numeric))::numeric(20,4)::text AS amount',
            [$paid, $total]
        )->amount;
    }

    public static function greaterThanZero(string $quantity): bool
    {
        return (int) DB::selectOne(
            'SELECT CASE WHEN CAST(? AS numeric) > 0 THEN 1 ELSE 0 END AS positive', [$quantity]
        )->positive === 1;
    }
}
