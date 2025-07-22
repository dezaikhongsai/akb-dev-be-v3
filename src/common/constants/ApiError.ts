export class ApiError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor( statusCode: number = 500 ,message: string) {
    super(message)

    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}
