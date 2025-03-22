import { Request, Response, NextFunction } from 'express';
import * as xssFilters from 'xss-filters';

export const xssClean = (req: Request, res: Response, next: NextFunction) => {
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      req.params[key] =
        typeof req.params[key] === 'string'
          ? xssFilters.inHTMLData(req.params[key])
          : req.params[key];
    });
  }

  if (req.query) {
    Object.keys(req.query).forEach(key => {
      req.query[key] =
        typeof req.query[key] === 'string' ? xssFilters.inHTMLData(req.query[key]) : req.query[key];
    });
  }

  if (req.body) {
    const sanitizeObject = (obj: Record<string, any>): void => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = xssFilters.inHTMLData(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };

    sanitizeObject(req.body);
  }

  next();
};
