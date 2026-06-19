// Domain errors carry an HTTP status; the global onError maps them to the envelope
// so handlers never build error responses by hand.
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(422, message, errors)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Tidak terautentikasi.') {
    super(401, message)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan.') {
    super(404, message)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message)
  }
}
