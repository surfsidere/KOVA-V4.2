/**
 * Clean Architecture Patterns
 * SOLID principles with zero technical debt
 */

// Domain Layer - Pure business logic
export interface Entity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface Repository<T extends Entity> {
  find(id: string): Promise<T | null>
  findAll(criteria?: any): Promise<T[]>
  save(entity: T): Promise<T>
  delete(id: string): Promise<void>
}

export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>
}

// Infrastructure Layer
export abstract class BaseRepository<T extends Entity> implements Repository<T> {
  protected abstract storageKey: string
  
  async find(id: string): Promise<T | null> {
    const items = await this.getAll()
    return items.find(item => item.id === id) || null
  }
  
  async findAll(criteria?: (item: T) => boolean): Promise<T[]> {
    const items = await this.getAll()
    return criteria ? items.filter(criteria) : items
  }
  
  async save(entity: T): Promise<T> {
    const items = await this.getAll()
    const existingIndex = items.findIndex(item => item.id === entity.id)
    
    entity.updatedAt = new Date()
    
    if (existingIndex >= 0) {
      items[existingIndex] = entity
    } else {
      entity.createdAt = new Date()
      items.push(entity)
    }
    
    await this.saveAll(items)
    return entity
  }
  
  async delete(id: string): Promise<void> {
    const items = await this.getAll()
    const filtered = items.filter(item => item.id !== id)
    await this.saveAll(filtered)
  }
  
  private async getAll(): Promise<T[]> {
    if (typeof window === 'undefined') {
      return []
    }
    
    const stored = localStorage.getItem(this.storageKey)
    return stored ? JSON.parse(stored) : []
  }
  
  private async saveAll(items: T[]): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(items))
    }
  }
}

// Application Layer
export abstract class BaseUseCase<TRequest, TResponse> implements UseCase<TRequest, TResponse> {
  abstract execute(request: TRequest): Promise<TResponse>
  
  protected validate(request: TRequest, schema: ValidationSchema<TRequest>): ValidationResult {
    const errors: string[] = []
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = (request as any)[field]
      
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`)
      }
      
      if (value && rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`)
      }
      
      if (value && rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`)
      }
      
      if (value && rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters`)
      }
      
      if (value && rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`)
      }
      
      if (value && rules.custom && !rules.custom(value)) {
        errors.push(`${field} validation failed`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Error Handling
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404)
  }
}

export class ValidationError extends DomainError {
  constructor(errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`, 'VALIDATION_ERROR', 400)
  }
}

// Result Pattern
export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}
  
  static success<T>(value: T): Result<T> {
    return new Result(true, value)
  }
  
  static failure<E>(error: E): Result<never, E> {
    return new Result(false, undefined, error)
  }
  
  get isSuccess(): boolean {
    return this._isSuccess
  }
  
  get isFailure(): boolean {
    return !this._isSuccess
  }
  
  get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed result')
    }
    return this._value!
  }
  
  get error(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful result')
    }
    return this._error!
  }
  
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.success(fn(this._value!))
    }
    return Result.failure(this._error!)
  }
  
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isSuccess) {
      return fn(this._value!)
    }
    return Result.failure(this._error!)
  }
  
  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this._isSuccess) {
      return Result.success(this._value!)
    }
    return Result.failure(fn(this._error!))
  }
}

// Command Pattern
export interface Command<T = void> {
  execute(): Promise<T>
}

export class CommandBus {
  private handlers = new Map<string, (command: any) => Promise<any>>()
  
  register<T extends Command>(
    commandType: new (...args: any[]) => T,
    handler: (command: T) => Promise<any>
  ): void {
    this.handlers.set(commandType.name, handler)
  }
  
  async execute<T>(command: Command<T>): Promise<T> {
    const handler = this.handlers.get(command.constructor.name)
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.constructor.name}`)
    }
    
    return handler(command)
  }
}

// Query Pattern
export interface Query<T> {
  readonly queryType: string
}

export class QueryBus {
  private handlers = new Map<string, (query: any) => Promise<any>>()
  
  register<T extends Query<any>, R>(
    queryType: string,
    handler: (query: T) => Promise<R>
  ): void {
    this.handlers.set(queryType, handler)
  }
  
  async execute<T, R>(query: Query<R>): Promise<R> {
    const handler = this.handlers.get(query.queryType)
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.queryType}`)
    }
    
    return handler(query)
  }
}

// Observer Pattern
export interface Observer<T> {
  update(data: T): void
}

export class Observable<T> {
  private observers: Observer<T>[] = []
  
  subscribe(observer: Observer<T>): () => void {
    this.observers.push(observer)
    
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }
  
  notify(data: T): void {
    this.observers.forEach(observer => observer.update(data))
  }
}

// Factory Pattern
export interface Factory<T> {
  create(...args: any[]): T
}

export abstract class AbstractFactory<T> implements Factory<T> {
  abstract create(...args: any[]): T
  
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Builder Pattern
export abstract class Builder<T> {
  protected product: Partial<T> = {}
  
  abstract build(): T
  
  reset(): this {
    this.product = {}
    return this
  }
}

// Decorator Pattern
export function Memoize(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value
  const cache = new Map()
  
  descriptor.value = function (...args: any[]) {
    const key = JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = originalMethod.apply(this, args)
    cache.set(key, result)
    
    return result
  }
  
  return descriptor
}

export function Retry(maxAttempts: number = 3, delay: number = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      let lastError: Error
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args)
        } catch (error) {
          lastError = error as Error
          
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delay * attempt))
          }
        }
      }
      
      throw lastError!
    }
    
    return descriptor
  }
}

export function LogExecution(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value
  
  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now()
    console.log(`Executing ${target.constructor.name}.${propertyName}`)
    
    try {
      const result = await originalMethod.apply(this, args)
      const duration = Date.now() - startTime
      console.log(`Completed ${target.constructor.name}.${propertyName} in ${duration}ms`)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`Failed ${target.constructor.name}.${propertyName} after ${duration}ms:`, error)
      throw error
    }
  }
  
  return descriptor
}

// Type definitions
interface ValidationRule {
  required?: boolean
  type?: string
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean
}

type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}