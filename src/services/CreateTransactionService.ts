// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';
import Category from '../models/Category';

interface Request {
    title: string;
    value: number;
    type: string;
    categoryTitle: string;
}

class CreateTransactionService {
    public async execute({
        title,
        value,
        type,
        categoryTitle,
    }: Request): Promise<Transaction> {
        const transactionsRepository = getCustomRepository(
            TransactionsRepository,
        );

        const categoryRepository = getRepository(Category);

        if (type !== 'income' && type !== 'outcome') {
            throw new AppError('Invalid transaction type.');
        }

        if (type === 'outcome') {
            const balance = await transactionsRepository.getBalance();
            if (balance.total < value) {
                throw new AppError(
                    'You do not have balance to this transaction.',
                );
            }
        }

        const categoryExists = await categoryRepository.findOne({
            where: { title: categoryTitle },
        });

        let category: Category;
        if (categoryExists) {
            category = categoryExists;
        } else {
            const newCategory = await categoryRepository.save({
                title: categoryTitle,
            });
            category = newCategory;
        }

        const transaction = transactionsRepository.create({
            title,
            value,
            category_id: category.id,
            type: type === 'outcome' ? 'outcome' : 'income',
        });

        await transactionsRepository.insert(transaction);
        return transaction;
    }
}

export default CreateTransactionService;
