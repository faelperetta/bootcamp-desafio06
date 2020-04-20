import parse from 'csv-parse/lib/sync';
import fs from 'fs';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface TransactionCSV {
    title: string;
    value: number;
    type: string;
    category: string;
}

class ImportTransactionsService {
    async execute(filename: string): Promise<Transaction[]> {
        const createService = new CreateTransactionService();
        const file = fs.readFileSync(filename);

        const records = parse(file, {
            delimiter: ',',
            columns: ['title', 'type', 'value', 'category'],
            skip_lines_with_empty_values: true,
        });

        const transactions: TransactionCSV[] = records
            .filter((record: TransactionCSV) => record.title !== 'title')
            .map((record: TransactionCSV) => {
                return {
                    title: record.title.trim(),
                    type: record.type.trim(),
                    category: record.category.trim(),
                    value: Number(record.value),
                };
            });

        const promise = transactions.map(transaction =>
            createService.execute({
                title: transaction.title,
                value: transaction.value,
                type: transaction.type,
                categoryTitle: transaction.category,
            }),
        );

        const newTransactions = await Promise.all(promise);

        return newTransactions;
    }
}

export default ImportTransactionsService;
