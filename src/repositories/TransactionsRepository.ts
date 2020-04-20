import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
    income: number;
    outcome: number;
    total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
    private async getTotalByType(type: string): Promise<number> {
        const transactions = await this.find({ relations: ['category'] });
        const totalTransactionsByType = transactions
            .filter(transaction => transaction.type === type)
            .reduce(
                (previousValue, currentValue) => {
                    const value = {
                        value:
                            Number(previousValue.value) +
                            Number(currentValue.value),
                        type: previousValue.type,
                        id: '0',
                        title: '',
                    };

                    return value;
                },
                {
                    value: 0,
                    type,
                    title: '',
                    id: '0',
                },
            );

        return totalTransactionsByType.value;
    }

    public async getBalance(): Promise<Balance> {
        const totalOfIncome = await this.getTotalByType('income');
        const totalOfOutcome = await this.getTotalByType('outcome');
        return {
            income: totalOfIncome,
            outcome: totalOfOutcome,
            total: totalOfIncome - totalOfOutcome,
        };
    }
}

export default TransactionsRepository;
