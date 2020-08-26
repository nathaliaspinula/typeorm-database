// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: string;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance', 400);
    }

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Invalid type');
    }

    const categoryExists = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    let createdCategory;
    let category_id;

    if (!categoryExists) {
      const newCategory = categoryRepository.create({
        title: category,
      });

      createdCategory = await categoryRepository.save(newCategory);
    }

    if (createdCategory) {
      category_id = createdCategory.id;
    } else {
      category_id = categoryExists?.id;
    }

    const transactionToBeSaved = transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    const transaction = await transactionRepository.save(transactionToBeSaved);

    return transaction;
  }
}

export default CreateTransactionService;
