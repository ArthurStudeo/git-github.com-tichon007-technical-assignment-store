# Store and Restrict Decorator Assignment

This is the repository for the technical test of creating a Store class and a Restrict decorator to manage access to user-generated content and data.

## Context

We are dealing with a runtime-defined project with a lot of user-generated content and data. To efficiently manage this data, we needed a way to store generated state and define permission strategies. This led to the creation of the Store class and Restrict decorator. Any entity in our application can inherit from these classes, thereby having structured storage and permission-based access control.

## Task Description

In this task, you need to complete the `Store` class and the `Restrict` decorator using TypeScript. The `Store` class and `Restrict` decorator should work together to allow or disallow access to data fields based on the specified permissions.

## Requirements

- The `Store` class should implement the `IStore` interface, and its methods need to be filled with the appropriate logic.
- `Store` class should be able to:
  - Store and manage different types of JSON values.
  - Determine if a specific key is allowed to be read or written.
  - Write new entries, and list all existing entries.
  - Handle read and write operations for nested keys.
- The `Restrict` decorator should be able to set the access permissions to the data fields of the classes that use it. The permissions can be:
  - `"r"`: read-only
  - `"w"`: write-only
  - `"rw"`: read and write
  - `"none"`: no access

## Technical Details

You need to complete the following parts of the codebase:

- The `Restrict` decorator function in `store.ts`
- The methods of the `Store` class in `store.ts`
- Add any additional code needed for your solution

You can use the test cases provided in `test.ts` to validate your implementation.

## How to submit your solution

1. Fork this repository.
2. Implement the `Restrict` decorator, `Store` class and add any additional code needed.
3. Push your changes to your forked repository.
4. Send us the link to your forked repository.

## Evaluation Criteria

Your implementation will be evaluated based on the following criteria:

- Code quality and clarity.
- Correctness of the implementation, i.e., all test cases in `test.ts` should pass.
- Adherence to TypeScript and JavaScript best practices.

## Further Guidance

While implementing, remember that the aim is not just to pass the tests but to also write clean, efficient, and well-structured code. Pay attention to details such as proper error handling, efficient data structures and algorithms, clear variable and function names, and good overall structure.

Good luck!
