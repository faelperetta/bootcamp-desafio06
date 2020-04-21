import parse from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface CSVTransaction {
    title: string;
    value: number;
    type: string;
    category: string;
}

class ImportTransactionsService {
    async execute(filename: string): Promise<Transaction[]> {
        const createService = new CreateTransactionService();
        const csvTransactions: CSVTransaction[] = [];

        const transactionReadStream = fs.createReadStream(filename);
        const csvParser = parse({
            from_line: 2,
        });

        transactionReadStream.pipe(csvParser);

        csvParser.on('data', async line => {
            const [title, type, value, category] = line.map((cell: string) =>
                cell.trim(),
            );

            if (!title || !value || !type || !category) return;

            csvTransactions.push({
                title,
                value: Number(value),
                type,
                category,
            });
        });

        await new Promise(resolve => csvParser.on('end', resolve));

        const promise = csvTransactions.map(transaction =>
            createService.execute(
                {
                    title: transaction.title,
                    value: transaction.value,
                    type: transaction.type,
                    categoryTitle: transaction.category,
                },
                true,
            ),
        );

        const newTransactions = await Promise.all(promise);
        return newTransactions;
    }
}

export default ImportTransactionsService;
