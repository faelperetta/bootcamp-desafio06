import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import CreateTransactionService from '../services/CreateTransactionService';

import TransactionsRepository from '../repositories/TransactionsRepository';
import DeleteTransactionService from '../services/DeleteTransactionService';
import uploadConfig from '../config/upload';
import ImportTransactionsService from '../services/ImportTransactionsService';

const upload = multer(uploadConfig);

const transactionsRouter = Router();
transactionsRouter.get('/', async (request, response) => {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions = await transactionsRepository.find({
        relations: ['category'],
    });
    const balance = await transactionsRepository.getBalance();
    return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
    const { title, value, type, category } = request.body;

    const createTransationService = new CreateTransactionService();

    const transaction = await createTransationService.execute({
        title,
        value,
        type,
        categoryTitle: category,
    });
    return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
    const { id } = request.params;

    const deleteTransactionService = new DeleteTransactionService();
    await deleteTransactionService.execute(id);

    return response.status(204).send();
});

transactionsRouter.post(
    '/import',
    upload.single('file'),
    async (request, response) => {
        const importService = new ImportTransactionsService();
        const transactions = await importService.execute(
            `${uploadConfig.directory}/${request.file.filename}`,
        );
        return response.json(transactions);
    },
);
export default transactionsRouter;
