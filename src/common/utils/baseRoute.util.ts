import { nextCatch } from "@common/index";
import express from "express";

export abstract class BaseRoute {
  constructor(
    protected readonly router: express.Router,
    protected readonly basePath: string
  ) {}

  protected errorHandler(handler: Function) {
    return nextCatch(handler.bind(this));
  }
}
