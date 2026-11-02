/** Erreur métier portant directement le code HTTP à renvoyer. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export class ValidationError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message);
  }
}
