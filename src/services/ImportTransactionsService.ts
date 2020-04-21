/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
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
        const result: Transaction[] = [];

        for (const csvTransaction of csvTransactions) {
            const transaction = await createService.execute({
                title: csvTransaction.title,
                value: csvTransaction.value,
                type: csvTransaction.type,
                categoryTitle: csvTransaction.category,
            });

            result.push(transaction);
        }

        await fs.promises.unlink(filename);
        return result;
    }
}

export default ImportTransactionsService;
