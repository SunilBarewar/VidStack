# Logger Service Documentation

## Overview

This is a custom logging service built on top of Winston that provides structured logging with enhanced features like error formatting, sensitive data redaction, and optional integration with HyperDX for observability.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Components](#core-components)
- [Key Features](#key-features)
- [Log Levels Explained](#log-levels-explained)
- [Environment Configuration](#environment-configuration)
- [Real-World Usage Examples](#real-world-usage-examples)
- [HyperDX Integration](#hyperdx-integration)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Installation

```bash
npm install winston @hyperdx/node-opentelemetry
```

## Quick Start

```typescript
import { createLogger } from "./logger";

const logger = createLogger({
  name: "my-service",
  hyperdxApiKey: process.env.HYPERDX_API_KEY, // Optional
});

logger.info({ message: "Application started", port: 3000 });
logger.error({ error: new Error("Something went wrong") });
```

## Core Components

### Logger Creation Function

```typescript
createLogger({ name, hyperdxApiKey }): ILogger
```

Creates a configured Winston logger instance with the following features:

- Structured JSON logging
- Automatic error formatting
- Sensitive data redaction
- Optional HyperDX integration for centralized log management
- Environment-aware service naming

#### Parameters

| Parameter       | Type     | Required | Description                                                      |
| --------------- | -------- | -------- | ---------------------------------------------------------------- |
| `name`          | `string` | Yes      | Base name for your service (e.g., "auth-service", "payment-api") |
| `hyperdxApiKey` | `string` | No       | API key for HyperDX observability platform                       |

#### Returns

Returns a Winston `Logger` instance with enhanced functionality.

#### Service Naming Convention

The logger automatically creates a service identifier in the format:

```
${name}-${NODE_ENV}
```

**Examples:**

- `auth-service-production`
- `payment-api-dev`
- `user-service-staging`

## Key Features

### 1. Error Formatting

The `errorFormatter` enhances error objects by preserving stack traces and messages, ensuring errors are properly serialized in JSON logs.

#### Before Formatting

```typescript
logger.error({ error: new Error("Database connection failed") });
```

#### After Formatting (Actual Log Output)

```json
{
  "level": "error",
  "message": "",
  "error": {
    "message": "Database connection failed",
    "stack": "Error: Database connection failed\n    at Database.connect (/app/db.js:45:11)\n    at ...",
    "name": "Error"
  },
  "service": "api-production",
  "timestamp": "2025-10-11T10:30:45.123Z"
}
```

**Why this matters:** JavaScript Error objects don't serialize well to JSON by default. This formatter ensures you capture the full error context including stack traces.

### 2. Sensitive Data Redaction

Automatically redacts sensitive information from logs to prevent credential leaks and maintain security compliance.

#### Protected Keys

The following keys are automatically redacted (case-insensitive, partial matching):

- `password`
- `token`
- `secret`
- `authorization`
- `apiKey`

#### Example

**Input:**

```typescript
logger.info({
  user: "john@example.com",
  password: "secret123",
  apiKey: "abc-xyz-789",
  userPassword: "another-secret",
  data: {
    authToken: "bearer-token-here",
  },
});
```

**Output:**

```json
{
  "level": "info",
  "user": "john@example.com",
  "password": "[REDACTED]",
  "apiKey": "[REDACTED]",
  "userPassword": "[REDACTED]",
  "data": {
    "authToken": "[REDACTED]"
  },
  "service": "api-production",
  "timestamp": "2025-10-11T10:30:45.123Z"
}
```

**Key Detection Rules:**

- Case-insensitive matching
- Partial key matching (e.g., "userPassword", "API_KEY", "secretKey" all match)
- Nested object traversal
- Preserves Date objects as ISO strings

### 3. Custom Log Levels

Combines Pino's ISO levels with Winston's syslog levels for comprehensive logging hierarchy.

| Level   | Priority | Description            | Use Case                                 |
| ------- | -------- | ---------------------- | ---------------------------------------- |
| `fatal` | 0        | Application crashes    | Unrecoverable errors, app must shut down |
| `error` | 3        | Error conditions       | Errors that need immediate attention     |
| `warn`  | 4        | Warning conditions     | Unusual but handled situations           |
| `info`  | 6        | Informational messages | General business events                  |
| `debug` | 7        | Debug information      | Detailed diagnostic information          |
| `trace` | 7        | Trace information      | Most granular diagnostic details         |

**Priority Rule:** Lower numbers = Higher priority. When you set a log level, only logs at that level or higher priority (lower number) are output.

### 4. Date Handling

Date objects in log metadata are automatically converted to ISO 8601 format strings:

```typescript
logger.info({
  event: "user_created",
  createdAt: new Date(),
});

// Output:
// { "event": "user_created", "createdAt": "2025-10-11T10:30:45.123Z" }
```

### 5. Test Environment Silence

Automatically silences all log output when `NODE_ENV === "test"` to keep test output clean:

```typescript
// In test environment
logger.error({ error: new Error("Test error") }); // No output
```

## Log Levels Explained

### What is LOG_LEVEL?

`LOG_LEVEL` is an environment variable that determines the minimum severity of logs that will be output. Setting a log level acts as a filter, showing only messages at that level or higher priority.

**Configuration:**

```bash
export LOG_LEVEL=info
```

**Rule:** Only logs at the specified level **or higher priority** (lower number) are displayed.

### Log Level Hierarchy

```
fatal (0) ← Highest Priority
   ↓
error (3)
   ↓
warn (4)
   ↓
info (6)
   ↓
debug (7)
   ↓
trace (7) ← Lowest Priority
```

### Example: LOG_LEVEL=warn

```typescript
logger.trace({ msg: "Trace message" }); // ❌ Hidden (7 > 4)
logger.debug({ msg: "Debug message" }); // ❌ Hidden (7 > 4)
logger.info({ msg: "Info message" }); // ❌ Hidden (6 > 4)
logger.warn({ msg: "Warning!" }); // ✅ Visible (4 = 4)
logger.error({ msg: "Error!" }); // ✅ Visible (3 < 4)
logger.fatal({ msg: "Fatal!" }); // ✅ Visible (0 < 4)
```

## Environment Configuration

### Development Environment

**Configuration:**

```bash
LOG_LEVEL=debug
NODE_ENV=development
```

**Purpose:** Maximum visibility for debugging and development

**What You'll See:**

```typescript
const logger = createLogger({ name: "api" });

logger.trace({ query: "SELECT * FROM users" }); // ❌ Hidden
logger.debug({ cacheHit: true, key: "user:123" }); // ✅ Visible
logger.info({ endpoint: "/api/users", method: "GET" }); // ✅ Visible
logger.warn({ deprecation: "Old API version used" }); // ✅ Visible
logger.error({ error: new Error("DB error") }); // ✅ Visible
logger.fatal({ error: "Out of memory" }); // ✅ Visible
```

**Use Cases:**

- Debugging application logic
- Tracing request flows
- Monitoring cache behavior
- Understanding state changes
- Investigating integration issues

**Example Log Volume:** 1000-5000 logs per minute (high volume)

---

### Staging Environment

**Configuration:**

```bash
LOG_LEVEL=info
NODE_ENV=staging
```

**Purpose:** Balance between detail and noise for pre-production testing

**What You'll See:**

```typescript
const logger = createLogger({ name: "api" });

logger.debug({ calculation: complexMath }); // ❌ Hidden
logger.info({
  event: "user_registered",
  userId: "123",
  duration: "250ms",
}); // ✅ Visible
logger.warn({
  service: "payment-gateway",
  message: "Response time exceeded 2s",
}); // ✅ Visible
logger.error({ error: new Error("Payment failed") }); // ✅ Visible
```

**Use Cases:**

- Tracking business events
- Monitoring performance issues
- Validating integration behavior
- Identifying potential production issues
- Load testing analysis

**Example Log Volume:** 200-1000 logs per minute (moderate volume)

---

### Production Environment

**Configuration:**

```bash
LOG_LEVEL=warn
NODE_ENV=production
```

**Purpose:** Only log problems and critical information

**What You'll See:**

```typescript
const logger = createLogger({ name: "api" });

logger.debug({
  /* ... */
}); // ❌ Hidden
logger.info({
  /* ... */
}); // ❌ Hidden

logger.warn({
  alert: "API rate limit approaching",
  usage: "85%",
  threshold: "90%",
}); // ✅ Visible

logger.error({
  error: new Error("Payment processing failed"),
  orderId: "ORD-12345",
  amount: 99.99,
}); // ✅ Visible

logger.fatal({
  error: new Error("Database unreachable"),
  action: "shutting_down",
}); // ✅ Visible
```

**Why These Settings:**

- **Performance:** Reduces I/O overhead and CPU usage
- **Cost:** Significantly less log storage and processing needed
- **Signal-to-Noise:** Focus on actionable issues only
- **Security:** Minimizes potential data exposure
- **Incident Response:** Easier to identify critical issues

**Example Log Volume:** 10-100 logs per minute (low volume)

---

### Testing Environment

**Configuration:**

```bash
LOG_LEVEL=info  # Can be any level
NODE_ENV=test
```

**Purpose:** Silent logging during automated tests

**Behavior:**

```typescript
const logger = createLogger({ name: "api" });

// All logs are suppressed automatically
logger.fatal({ error: "Critical error" }); // No output
logger.error({ error: "Error" }); // No output
logger.warn({ msg: "Warning" }); // No output
logger.info({ msg: "Info" }); // No output
logger.debug({ msg: "Debug" }); // No output
```

**Why:** Keeps test output clean and focused on test results, not log messages.

---

### Environment Comparison Table

| Environment     | LOG_LEVEL          | Volume    | Purpose                      | Example Visibility              |
| --------------- | ------------------ | --------- | ---------------------------- | ------------------------------- |
| **Development** | `debug` or `trace` | Very High | Maximum debugging visibility | debug, info, warn, error, fatal |
| **Staging**     | `info`             | Moderate  | Business events + issues     | info, warn, error, fatal        |
| **Production**  | `warn` or `error`  | Low       | Problems only                | warn, error, fatal              |
| **Testing**     | Any (silenced)     | None      | Clean test output            | All suppressed                  |

## Real-World Usage Examples

### Example 1: Authentication Service

```typescript
import { createLogger } from "./logger";

const logger = createLogger({
  name: "auth-service",
  hyperdxApiKey: process.env.HYPERDX_API_KEY,
});

// Successful login
logger.info({
  event: "login_success",
  userId: "usr_123",
  email: "user@example.com",
  ip: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
});

// Failed login attempt (password automatically redacted)
logger.warn({
  event: "login_failed",
  email: "user@example.com",
  password: "wrongpass123", // Automatically becomes [REDACTED]
  reason: "invalid_credentials",
  ip: "192.168.1.1",
  attemptCount: 3,
});

// Critical authentication error
logger.error({
  event: "jwt_signing_failed",
  error: new Error("Private key not found"),
  userId: "usr_123",
});

// Account lockout
logger.warn({
  event: "account_locked",
  userId: "usr_123",
  reason: "too_many_failed_attempts",
  lockoutDuration: "30m",
});
```

---

## API Performance Monitoring with HyperDX

### Overview

HyperDX provides powerful API performance monitoring capabilities by ingesting structured logs and creating metrics, traces, and alerts from them.

### Key Metrics to Track

| Metric        | Description                   | Log Field           | HyperDX Query                   |
| ------------- | ----------------------------- | ------------------- | ------------------------------- |
| Response Time | Time to process request       | `duration`          | `avg(duration)`                 |
| Throughput    | Requests per minute           | Count of logs       | `count`                         |
| Error Rate    | Percentage of failed requests | `statusCode >= 400` | `count where statusCode >= 400` |
| P95 Latency   | 95th percentile response time | `duration`          | `p95(duration)`                 |
| Slow Queries  | Requests over threshold       | `duration > 1000`   | `count where duration > 1000`   |

### Implementation Examples

#### 1. Basic API Monitoring Middleware

```typescript
import { createLogger } from "./logger";
import express from "express";

const logger = createLogger({
  name: "api",
  hyperdxApiKey: process.env.HYPERDX_API_KEY,
});

const app = express();

// API monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();

  // Attach requestId to request for use in handlers
  req.requestId = requestId;

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Always log API metrics
    logger.info({
      event: "api_request",
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get("content-length"),
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      success: res.statusCode < 400,
    });
  });

  next();
});
```

#### 2. Advanced Monitoring with Database Tracking

```typescript
import { createLogger } from "./logger";

const logger = createLogger({
  name: "api",
  hyperdxApiKey: process.env.HYPERDX_API_KEY,
});

// Enhanced middleware with DB tracking
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  // Track database queries
  let dbQueryCount = 0;
  let dbQueryTime = 0;

  req.trackDbQuery = (queryDuration: number) => {
    dbQueryCount++;
    dbQueryTime += queryDuration;
  };

  res.on("finish", () => {
    const totalDuration = Date.now() - start;
    const apiDuration = totalDuration - dbQueryTime;

    logger.info({
      event: "api_request_detailed",
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,

      // Timing breakdown
      totalDuration,
      apiDuration, // Time spent in application logic
      dbQueryTime, // Time spent in database
      dbQueryCount, // Number of DB queries

      // Performance flags
      slowRequest: totalDuration > 1000,
      manyQueries: dbQueryCount > 5,
      slowDb: dbQueryTime > 500,

      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    // Alert on N+1 query problems
    if (dbQueryCount > 10) {
      logger.warn({
        event: "potential_n_plus_1_query",
        requestId,
        path: req.path,
        dbQueryCount,
        dbQueryTime,
      });
    }
  });

  next();
});

// Example route handler
app.get("/users/:id", async (req, res) => {
  const dbStart = Date.now();
  const user = await db.users.findById(req.params.id);
  req.trackDbQuery(Date.now() - dbStart);

  res.json(user);
});
```

#### 3. External API Call Monitoring

```typescript
import { createLogger } from "./logger";
import axios from "axios";

const logger = createLogger({
  name: "api-client",
  hyperdxApiKey: process.env.HYPERDX_API_KEY,
});

// Axios interceptor for external API monitoring
axios.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

axios.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;

    logger.info({
      event: "external_api_call",
      url: response.config.url,
      method: response.config.method,
      statusCode: response.status,
      duration,
      success: true,
    });

    return response;
  },
  (error) => {
    const duration = Date.now() - error.config.metadata.startTime;

    logger.error({
      event: "external_api_call_failed",
      url: error.config.url,
      method: error.config.method,
      statusCode: error.response?.status,
      duration,
      error: error,
      success: false,
    });

    throw error;
  },
);
```

#### 4. Endpoint-Specific Performance Tracking

```typescript
import { createLogger } from "./logger";

const logger = createLogger({
  name: "api",
  hyperdxApiKey: process.env.HYPERDX_API_KEY,
});

// Helper function to track endpoint performance
function trackEndpointPerformance(endpoint: string, operation: string) {
  return async (req, res, next) => {
    const start = Date.now();

    try {
      await next();

      const duration = Date.now() - start;

      logger.info({
        event: "endpoint_performance",
        endpoint,
        operation,
        duration,
        statusCode: res.statusCode,
        userId: req.user?.id,
        success: true,
      });
    } catch (error) {
      const duration = Date.now() - start;

      logger.error({
        event: "endpoint_error",
        endpoint,
        operation,
        duration,
        error: error as Error,
        userId: req.user?.id,
        success: false,
      });

      throw error;
    }
  };
}

// Usage
app.get(
  "/orders/:id",
  trackEndpointPerformance("/orders/:id", "get_order"),
  async (req, res) => {
    const order = await orderService.getById(req.params.id);
    res.json(order);
  },
);
```

### HyperDX Dashboard Examples

Once your logs are in HyperDX, you can create powerful dashboards:

#### Query Examples

```
# Average response time by endpoint
event:"api_request" | avg(duration) by path

# 95th percentile latency
event:"api_request" | p95(duration) by path

# Error rate percentage
event:"api_request" |
  sum(case when statusCode >= 400 then 1 else 0 end) / count(*) * 100

# Requests per minute
event:"api_request" | count by bin(timestamp, 1m)

# Slowest endpoints
event:"api_request" |
  avg(duration) by path |
  order by avg(duration) desc |
  limit 10

# Database performance
event:"api_request_detailed" |
  avg(dbQueryTime) by path,
  avg(dbQueryCount) by path

# External API health
event:"external_api_call" |
  avg(duration) by url,
  count where success = false by url
```

#### Alert Configurations

**1. Slow API Alert:**

```
Condition: event:"api_request" | avg(duration) > 2000
Frequency: Check every 5 minutes
Notification: Slack #alerts channel
Message: "API response time exceeded 2s"
```

**2. High Error Rate Alert:**

```
Condition: event:"api_request" |
  sum(case when statusCode >= 500 then 1 else 0 end) / count(*) > 0.05
Frequency: Check every 1 minute
Notification: PagerDuty
Message: "Server error rate above 5%"
```

**3. External API Failure Alert:**

```
Condition: event:"external_api_call" |
  count where success = false > 10
Frequency: Check every 5 minutes
Notification: Email to team
Message: "External API failing multiple times"
```

### Best Practices for API Monitoring

1. **Always Include Request ID**

   ```typescript
   const requestId = crypto.randomUUID();
   // Pass through entire request chain
   ```

2. **Track Both Success and Failure**

   ```typescript
   logger.info({ event: "api_request", success: statusCode < 400 });
   ```

3. **Break Down Response Time**

   ```typescript
   {
     totalDuration: 1500,
     apiDuration: 800,    // Application logic
     dbQueryTime: 600,    // Database queries
     cacheTime: 100       // Cache operations
   }
   ```

4. **Use Consistent Event Names**

   ```typescript
   event: "api_request"; // Not "request" or "api_call"
   event: "external_api_call"; // Not "external_request"
   ```

5. **Include Context for Debugging**

   ```typescript
   {
     userId: "usr_123",
     tenantId: "tenant_456",
     correlationId: "xyz",
     version: "v1"
   }
   ```

6. **Set Performance Thresholds**

   ```typescript
   const SLOW_THRESHOLD = 1000;
   const VERY_SLOW_THRESHOLD = 3000;

   if (duration > VERY_SLOW_THRESHOLD) {
     logger.error({ event: "very_slow_request", duration });
   } else if (duration > SLOW_THRESHOLD) {
     logger.warn({ event: "slow_request", duration });
   }
   ```

### Monitoring Microservices

For distributed systems, use correlation IDs:

```typescript
// Service A
app.use((req, res, next) => {
  const correlationId = req.headers["x-correlation-id"] || crypto.randomUUID();
  req.correlationId = correlationId;

  logger.info({
    event: "request_received",
    correlationId,
    service: "service-a",
    path: req.path,
  });

  next();
});

// When calling Service B
const response = await axios.get("http://service-b/api/users", {
  headers: {
    "x-correlation-id": req.correlationId,
  },
});

// Service B
app.use((req, res, next) => {
  const correlationId = req.headers["x-correlation-id"];

  logger.info({
    event: "request_received",
    correlationId,
    service: "service-b",
    path: req.path,
    calledBy: "service-a",
  });

  next();
});
```

In HyperDX, you can then trace the entire flow:

```
correlationId:"abc-123" | order by timestamp
```

This shows the complete request journey across all services.

---

### Example 2: API Request Logging Middleware

```typescript
import express from "express";
import { createLogger } from "./logger";

const app = express();
const logger = createLogger({ name: "api" });

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers["x-request-id"] || generateId();

  // Log incoming request
  logger.info({
    event: "request_received",
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Log slow requests as warnings
    if (duration > 1000) {
      logger.warn({
        event: "slow_request",
        requestId,
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
        threshold: 1000,
      });
    } else {
      logger.info({
        event: "request_completed",
        requestId,
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
      });
    }
  });

  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    event: "request_error",
    error: err,
    method: req.method,
    path: req.path,
    body: req.body,
  });

  res.status(500).json({ error: "Internal server error" });
});
```

---

### Example 3: Database Operations

```typescript
import { createLogger } from "./logger";

const logger = createLogger({ name: "database" });

class UserRepository {
  async findById(userId: string) {
    logger.debug({
      event: "db_query_start",
      operation: "findById",
      userId,
    });

    try {
      const user = await db.users.findOne({ id: userId });

      logger.info({
        event: "db_query_success",
        operation: "findById",
        userId,
        found: !!user,
      });

      return user;
    } catch (error) {
      logger.error({
        event: "db_query_failed",
        operation: "findById",
        userId,
        error: error as Error,
      });
      throw error;
    }
  }

  async updateProfile(userId: string, data: any) {
    logger.info({
      event: "profile_update_start",
      userId,
      fields: Object.keys(data),
    });

    try {
      await db.users.update({ id: userId }, data);

      logger.info({
        event: "profile_update_success",
        userId,
      });
    } catch (error) {
      logger.error({
        event: "profile_update_failed",
        userId,
        error: error as Error,
      });
      throw error;
    }
  }
}
```

---

### Example 4: Background Job Processing

```typescript
import { createLogger } from "./logger";

const logger = createLogger({ name: "job-processor" });

async function processPayment(orderId: string, amount: number) {
  const jobId = generateJobId();

  logger.info({
    event: "job_started",
    jobId,
    jobType: "process_payment",
    orderId,
    amount,
  });

  logger.debug({
    event: "payment_gateway_request",
    jobId,
    orderId,
    gateway: "stripe",
  });

  try {
    const result = await paymentGateway.charge({
      orderId,
      amount,
      apiKey: process.env.STRIPE_SECRET_KEY, // Automatically redacted
    });

    logger.info({
      event: "job_completed",
      jobId,
      jobType: "process_payment",
      orderId,
      transactionId: result.id,
      duration: result.processingTime,
    });

    return result;
  } catch (error) {
    logger.error({
      event: "job_failed",
      jobId,
      jobType: "process_payment",
      orderId,
      error: error as Error,
      retryable: isRetryableError(error),
    });

    throw error;
  }
}

// Job queue handler
queue.process("payment", async (job) => {
  try {
    await processPayment(job.data.orderId, job.data.amount);
  } catch (error) {
    logger.fatal({
      event: "job_fatal_error",
      jobId: job.id,
      error: error as Error,
      action: "moving_to_dead_letter_queue",
    });
    throw error;
  }
});
```

---

### Example 5: Microservice Communication

```typescript
import { createLogger } from "./logger";

const logger = createLogger({ name: "order-service" });

async function createOrder(orderData: any) {
  const correlationId = generateCorrelationId();

  logger.info({
    event: "order_creation_started",
    correlationId,
    userId: orderData.userId,
    itemCount: orderData.items.length,
  });

  // Call inventory service
  logger.debug({
    event: "calling_inventory_service",
    correlationId,
    service: "inventory",
    items: orderData.items.map((i) => i.id),
  });

  try {
    const inventoryCheck = await inventoryService.checkAvailability(
      orderData.items,
    );

    if (!inventoryCheck.available) {
      logger.warn({
        event: "insufficient_inventory",
        correlationId,
        unavailableItems: inventoryCheck.unavailableItems,
      });

      throw new Error("Insufficient inventory");
    }

    // Call payment service
    logger.debug({
      event: "calling_payment_service",
      correlationId,
      amount: orderData.total,
    });

    const payment = await paymentService.charge({
      userId: orderData.userId,
      amount: orderData.total,
      apiKey: process.env.PAYMENT_API_KEY, // Redacted
    });

    logger.info({
      event: "order_created",
      correlationId,
      orderId: payment.orderId,
      amount: orderData.total,
    });

    return payment;
  } catch (error) {
    logger.error({
      event: "order_creation_failed",
      correlationId,
      error: error as Error,
      stage: determineFailureStage(error),
    });

    throw error;
  }
}
```

---

### Example 6: Application Startup

```typescript
import { createLogger } from "./logger";

const logger = createLogger({
  name: "app",
  hyperdxApiKey: process.env.HYPERDX_API_KEY,
});

async function bootstrap() {
  logger.info({
    event: "app_starting",
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
  });

  try {
    // Database connection
    logger.debug({ event: "connecting_database" });
    await database.connect();
    logger.info({ event: "database_connected" });

    // Redis connection
    logger.debug({ event: "connecting_redis" });
    await redis.connect();
    logger.info({ event: "redis_connected" });

    // Start server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      logger.info({
        event: "app_started",
        port,
        pid: process.pid,
      });
    });
  } catch (error) {
    logger.fatal({
      event: "app_startup_failed",
      error: error as Error,
    });
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.warn({
    event: "shutdown_signal_received",
    signal: "SIGTERM",
  });

  try {
    await gracefulShutdown();
    logger.info({ event: "shutdown_complete" });
    process.exit(0);
  } catch (error) {
    logger.fatal({
      event: "shutdown_failed",
      error: error as Error,
    });
    process.exit(1);
  }
});
```

## HyperDX Integration

### What is HyperDX?

HyperDX is an observability platform that provides centralized log aggregation, search, monitoring, and alerting capabilities. It can trace every log, API request, database query, and correlate them with metrics and traces for comprehensive performance monitoring.

### Configuration

**With HyperDX:**

```typescript
const logger = createLogger({
  name: "my-service",
  hyperdxApiKey: process.env.HYPERDX_API_KEY,
});
```

**Without HyperDX:**

```typescript
const logger = createLogger({
  name: "my-service",
  // No hyperdxApiKey provided
});
```

### Transport Behavior

| Configuration           | Console Output | HyperDX Output |
| ----------------------- | -------------- | -------------- |
| Without `hyperdxApiKey` | ✅ Yes         | ❌ No          |
| With `hyperdxApiKey`    | ✅ Yes         | ✅ Yes         |

### HyperDX Features

When integrated with HyperDX, you get:

1. **Centralized Log Aggregation**
   - All logs from multiple services in one place
   - Cross-service correlation via `correlationId`

2. **Advanced Search & Filtering**
   - Full-text search across all log fields
   - Filter by service, level, timestamp, custom fields
   - Regular expression support

3. **Real-time Monitoring**
   - Live log streaming
   - Custom dashboards
   - Metric extraction from logs

4. **Alerting**
   - Configure alerts based on log patterns
   - Slack/PagerDuty/Email integrations
   - Anomaly detection

5. **Distributed Tracing**
   - Automatic resource detection
   - Request flow visualization
   - Performance bottleneck identification

### API Response Time Monitoring

HyperDX excels at API performance monitoring. By logging structured data about your API requests, you can:

**Track Key Metrics:**

- Response times (latency)
- Throughput (requests per minute)
- Error rates
- Slow endpoints
- Database query performance

**Example Implementation:**

```typescript
import { createLogger } from "./logger";

const logger = createLogger({
  name: "api",
  hyperdxApiKey: process.env.HYPERDX_API_KEY,
});

// Express middleware for API monitoring
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers["x-request-id"] || generateId();

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info({
      event: "api_request",
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration, // Response time in milliseconds
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    // Log slow requests separately for alerting
    if (duration > 1000) {
      logger.warn({
        event: "slow_api_request",
        requestId,
        method: req.method,
        path: req.path,
        duration,
        threshold: 1000,
      });
    }
  });

  next();
});
```

**In HyperDX Dashboard:**

You can then create charts and alerts:

- Average response time by endpoint
- 95th percentile latency
- Requests per minute
- Error rate percentage
- Slow query alerts (> 1 second)

**Example Query in HyperDX:**

```
event:"api_request" | avg(duration) by path
event:"api_request" | p95(duration) by path
event:"slow_api_request" | count by path
```

**Correlation with Traces:**

When using OpenTelemetry with HyperDX, you can correlate logs with distributed traces to see:

- Which database queries caused slowness
- External API call latencies
- Complete request flow across microservices

### HyperDX Configuration Options

```typescript
HyperDX.getWinstonTransport(logLevel, {
  detectResources: true, // Auto-detect cloud resources
  service: "my-service-production", // Service identifier
});
```

## Best Practices

### 1. Use Appropriate Log Levels

**Do:**

```typescript
// Fatal - Application must shut down
logger.fatal({
  error: new Error("Out of memory"),
  action: "shutting_down",
});

// Error - Something failed but app continues
logger.error({
  error: new Error("Payment processing failed"),
  orderId: "123",
  retryable: true,
});

// Warn - Unusual but handled condition
logger.warn({
  event: "rate_limit_approaching",
  usage: "85%",
  threshold: "90%",
});

// Info - Important business events
logger.info({
  event: "user_registered",
  userId: "usr_123",
});

// Debug - Detailed diagnostic info
logger.debug({
  event: "cache_hit",
  key: "user:123",
  ttl: 3600,
});
```

**Don't:**

```typescript
// Using wrong levels
logger.info({ error: criticalError }); // Should be error/fatal
logger.error({ msg: "User logged in" }); // Should be info
logger.debug({ msg: "Payment failed" }); // Should be error
```

---

### 2. Include Sufficient Context

**Do:**

```typescript
logger.error({
  error: new Error("Database query failed"),
  userId: "usr_123",
  operation: "updateProfile",
  query: "UPDATE users SET...",
  duration: 5000,
  timestamp: new Date(),
});
```

**Don't:**

```typescript
logger.error({ error }); // Missing context
logger.error("Error occurred"); // String instead of object
```

---

### 3. Use Structured Logging

**Do:**

```typescript
logger.info({
  event: "user_login",
  userId: "usr_123",
  ip: "192.168.1.1",
  timestamp: new Date(),
});
```

**Don't:**

```typescript
logger.info(`User usr_123 logged in from 192.168.1.1`);
// Hard to parse and query
```

---

### 4. Consistent Event Naming

**Do:**

```typescript
// Use consistent naming conventions
logger.info({ event: "user_created" });
logger.info({ event: "user_updated" });
logger.info({ event: "user_deleted" });

logger.info({ event: "order_placed" });
logger.info({ event: "order_confirmed" });
logger.info({ event: "order_shipped" });
```

**Don't:**

```typescript
// Inconsistent naming
logger.info({ event: "userCreated" });
logger.info({ event: "user-updated" });
logger.info({ action: "deleteUser" });
```

---

### 5. Avoid Logging Sensitive Data

**Do:**

```typescript
// Let redaction handle sensitive fields
logger.info({
  event: "api_call",
  userId: "usr_123",
  endpoint: "/api/payment",
  apiKey: "secret", // Will be redacted automatically
});

// Or omit sensitive data entirely
logger.info({
  event: "api_call",
  userId: "usr_123",
  endpoint: "/api/payment",
  // No sensitive data included
});
```

**Don't:**

```typescript
// Manually including PII without protection
logger.info({
  event: "user_data",
  ssn: "123-45-6789",
  creditCard: "4111-1111-1111-1111",
});
```

---

### 6. Use Correlation IDs

**Do:**

```typescript
const correlationId = req.headers["x-correlation-id"] || generateId();

logger.info({
  event: "request_received",
  correlationId,
  endpoint: "/api/orders",
});

// Pass to other services
await inventoryService.check(items, { correlationId });

logger.info({
  event: "inventory_checked",
  correlationId,
});
```

---

### 7. Log Performance Metrics

**Do:**

```typescript
const start = Date.now();

try {
  const result = await expensiveOperation();
  const duration = Date.now() - start;

  if (duration > 1000) {
    logger.warn({
      event: "slow_operation",
      operation: "expensiveOperation",
      duration,
      threshold: 1000,
    });
  } else {
    logger.debug({
      event: "operation_completed",
      operation: "expensiveOperation",
      duration,
    });
  }
} catch (error) {
  logger.error({
    event: "operation_failed",
    operation: "expensiveOperation",
    duration: Date.now() - start,
    error: error as Error,
  });
}
```

---

### 8. Handle Errors Properly

**Do:**

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error({
    event: "operation_failed",
    operation: "riskyOperation",
    error: error as Error, // Properly typed
    retryable: isRetryable(error),
    context: { userId, orderId },
  });

  // Rethrow or handle
  throw error;
}
```

**Don't:**

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error({ msg: "Error" }); // Lost error details
  // Swallowing error silently
}
```

---

### 9. Environment-Specific Configuration

**Do:**

```bash
# .env.development
LOG_LEVEL=debug
HYPERDX_API_KEY=

# .env.staging
LOG_LEVEL=info
HYPERDX_API_KEY=hyperdx_staging_key

# .env.production
LOG_LEVEL=warn
HYPERDX_API_KEY=hyperdx_prod_key
```

---

### 10. Testing Considerations

**Do:**

```typescript
// In tests, logs are automatically silenced
describe("UserService", () => {
  it("should create user", async () => {
    // Logger won't output anything
    await userService.create(userData);
    // Your assertions
  });
});

// For debugging specific tests, temporarily change NODE_ENV
process.env.NODE_ENV = "development";
const logger = createLogger({ name: "test" });
process.env.NODE_ENV = "test";
```

---

## API Reference

### createLogger(options)

Creates a configured Winston logger instance.

#### Parameters

```typescript
interface CreateLoggerOptions {
  name: string; // Service name (required)
  hyperdxApiKey?: string; // HyperDX API key (optional)
}
```

#### Returns

```typescript
ILogger; // Winston Logger instance
```

#### Logger Methods

```typescript
logger.fatal(meta: object): void
logger.error(meta: object): void
logger.warn(meta: object): void
logger.info(meta: object): void
logger.debug(meta: object): void
logger.trace(meta: object): void
```

#### Meta Object Structure

```typescript
interface LogMeta {
  event?: string; // Event identifier
  error?: Error; // Error object (auto-formatted)
  [key: string]: any; // Any additional context
}
```

---

### Environment Variables

| Variable          | Type   | Required | Default  | Description                                    |
| ----------------- | ------ | -------- | -------- | ---------------------------------------------- |
| `LOG_LEVEL`       | string | No       | `"info"` | Minimum log level to output                    |
| `NODE_ENV`        | string | No       | `"dev"`  | Environment name (dev/staging/production/test) |
| `HYPERDX_API_KEY` | string | No       | -        | HyperDX API key for log aggregation            |

---

### Supported Log Levels

```typescript
type LogLevel =
  | "fatal" // Priority 0
  | "error" // Priority 3
  | "warn" // Priority 4
  | "info" // Priority 6
  | "debug" // Priority 7
  | "trace"; // Priority 7
```

---

## Troubleshooting

### Logs Not Appearing

**Problem:** No logs are showing up.

**Solutions:**

1. Check `LOG_LEVEL` environment variable
   ```bash
   echo $LOG_LEVEL
   ```
2. Verify you're not in test environment
   ```bash
   echo $NODE_ENV
   ```
3. Ensure you're logging at or above the configured level

   ```typescript

   ```
