// The 'test' program.
program test.aleo {
    transition main(public a: u64, b: u64) -> u64 {
        let c: u64 = a / b;
        return c;
    }

    transition fraction(public numerator: u64, denominator: u64) -> u64 {
        let quotient: u64 = numerator / denominator;
        return quotient;
    }

    transition fraction_u128(public numerator: u128, denominator: u128) -> u128 {
        let quotient: u128 = numerator / denominator;
        return quotient;
    }
}
