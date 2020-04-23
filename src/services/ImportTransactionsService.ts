import parse from 'csv-parse';
import fs from 'fs';
import { getRepository, In, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
    title: string;
    value: number;
    type: 'income' | 'outcome';
    category: string;
}

class ImportTransactionsService {
    async execute(filename: string): Promise<Transaction[]> {
        const transactionRepository = getCustomRepository(
            TransactionsRepository,
        );
        const csvTransactions: CSVTransaction[] = [];
        const categories: string[] = [];

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

            categories.push(category);

            csvTransactions.push({
                title,
                value: Number(value),
                type,
                category,
            });
        });
        await new Promise(resolve => csvParser.on('end', resolve));

        const categoryRepository = getRepository(Category);
        const existentCategories = await categoryRepository.find({
            where: { title: In(categories) },
        });

        const existentCategoriesTitle = existentCategories.map(
            existentCategory => existentCategory.title,
        );

        const addCategoriesTitle = categories
            .filter(category => !existentCategoriesTitle.includes(category))
            .filter(
                (category, index, self) => self.indexOf(category) === index,
            );

        const newCategories = addCategoriesTitle.map(title =>
            categoryRepository.create({ title }),
        );

        if (newCategories.length > 0) {
            await categoryRepository.insert(newCategories);
        }

        const finalCategories = [...newCategories, ...existentCategories];
        const transactions: Transaction[] = csvTransactions.map(transaction => {
            return transactionRepository.create({
                title: transaction.title,
                value: transaction.value,
                category: finalCategories.find(
                    category => category.title === transaction.category,
                ),
                type: transaction.type,
            });
        });

        transactionRepository.save(transactions);
        await fs.promises.unlink(filename);
        return transactions;
    }
}

export default ImportTransactionsService;
