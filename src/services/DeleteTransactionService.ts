// import AppError from '../errors/AppError';

import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

class DeleteTransactionService {
    public async execute(transactionId: string): Promise<void> {
        const transactionsRepository = getCustomRepository(
            TransactionsRepository,
        );

        const transactionExists = await transactionsRepository.findOne({
            where: { id: transactionId },
        });

        if (!transactionExists) {
            throw new AppError('Transaction not found', 404);
        }

        await transactionsRepository.remove(transactionExists);
    }
}

export default DeleteTransactionService;
