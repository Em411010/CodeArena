import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SampleProblem from '../models/SampleProblem.js';
import User from '../models/User.js';

dotenv.config();

const cPracticeProblems = [
  {
    title: 'Hello World',
    description: `Write a C program that prints "Hello, World!" to the console.

This is the classic first program that every programmer writes. It introduces you to the basic structure of a C program and the printf function.`,
    difficulty: 'easy',
    allowedLanguages: ['c'],
    constraints: 'None',
    inputFormat: 'No input required',
    outputFormat: 'Print "Hello, World!" (without quotes)',
    sampleInput: 'N/A',
    sampleOutput: 'Hello, World!',
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ['basics', 'printf', 'stdio'],
    testCases: [
      { input: ' ', expectedOutput: 'Hello, World!', isHidden: false }
    ]
  },
  {
    title: 'Sum of Two Numbers',
    description: `Write a C program that reads two integers from the user and prints their sum.

You will use scanf to read input and printf to display the output.`,
    difficulty: 'easy',
    allowedLanguages: ['c'],
    constraints: '-10^9 ≤ a, b ≤ 10^9',
    inputFormat: 'Two integers a and b separated by space',
    outputFormat: 'Print the sum of a and b',
    sampleInput: '5 3',
    sampleOutput: '8',
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ['basics', 'scanf', 'arithmetic'],
    testCases: [
      { input: '5 3', expectedOutput: '8', isHidden: false },
      { input: '10 20', expectedOutput: '30', isHidden: false },
      { input: '-5 5', expectedOutput: '0', isHidden: true },
      { input: '1000000 2000000', expectedOutput: '3000000', isHidden: true }
    ]
  },
  {
    title: 'Even or Odd',
    description: `Write a C program that determines whether a given integer is even or odd.

Use the modulo operator (%) to check if a number is divisible by 2.`,
    difficulty: 'easy',
    allowedLanguages: ['c'],
    constraints: '-10^6 ≤ n ≤ 10^6',
    inputFormat: 'A single integer n',
    outputFormat: 'Print "Even" if n is even, otherwise print "Odd"',
    sampleInput: '4',
    sampleOutput: 'Even',
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ['basics', 'conditionals', 'modulo'],
    testCases: [
      { input: '4', expectedOutput: 'Even', isHidden: false },
      { input: '7', expectedOutput: 'Odd', isHidden: false },
      { input: '0', expectedOutput: 'Even', isHidden: true },
      { input: '-3', expectedOutput: 'Odd', isHidden: true }
    ]
  },
  {
    title: 'Factorial Calculator',
    description: `Write a C program that calculates the factorial of a non-negative integer n.

The factorial of n (written as n!) is the product of all positive integers less than or equal to n.
For example: 5! = 5 × 4 × 3 × 2 × 1 = 120

Note: 0! = 1 by definition.`,
    difficulty: 'easy',
    allowedLanguages: ['c'],
    constraints: '0 ≤ n ≤ 12',
    inputFormat: 'A single non-negative integer n',
    outputFormat: 'Print the factorial of n',
    sampleInput: '5',
    sampleOutput: '120',
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ['loops', 'math', 'factorial'],
    testCases: [
      { input: '5', expectedOutput: '120', isHidden: false },
      { input: '0', expectedOutput: '1', isHidden: false },
      { input: '1', expectedOutput: '1', isHidden: true },
      { input: '10', expectedOutput: '3628800', isHidden: true },
      { input: '12', expectedOutput: '479001600', isHidden: true }
    ]
  },
  {
    title: 'Reverse a String',
    description: `Write a C program that reads a string and prints it in reverse order.

Use string.h library functions like strlen() to find the length of the string.`,
    difficulty: 'medium',
    allowedLanguages: ['c'],
    constraints: '1 ≤ length of string ≤ 100, string contains only alphanumeric characters',
    inputFormat: 'A single string without spaces',
    outputFormat: 'Print the reversed string',
    sampleInput: 'hello',
    sampleOutput: 'olleh',
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ['strings', 'loops', 'string.h'],
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isHidden: false },
      { input: 'CodeArena', expectedOutput: 'anerAedoC', isHidden: false },
      { input: 'a', expectedOutput: 'a', isHidden: true },
      { input: 'racecar', expectedOutput: 'racecar', isHidden: true }
    ]
  },
  {
    title: 'Prime Number Checker',
    description: `Write a C program that determines whether a given positive integer is a prime number.

A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.

Hint: You only need to check divisibility up to the square root of n. Use sqrt() from math.h.`,
    difficulty: 'medium',
    allowedLanguages: ['c'],
    constraints: '1 ≤ n ≤ 10^6',
    inputFormat: 'A single positive integer n',
    outputFormat: 'Print "Prime" if n is prime, otherwise print "Not Prime"',
    sampleInput: '17',
    sampleOutput: 'Prime',
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ['math', 'loops', 'prime', 'math.h'],
    testCases: [
      { input: '17', expectedOutput: 'Prime', isHidden: false },
      { input: '4', expectedOutput: 'Not Prime', isHidden: false },
      { input: '1', expectedOutput: 'Not Prime', isHidden: true },
      { input: '2', expectedOutput: 'Prime', isHidden: true },
      { input: '97', expectedOutput: 'Prime', isHidden: true },
      { input: '100', expectedOutput: 'Not Prime', isHidden: true }
    ]
  },
  {
    title: 'Count Vowels and Consonants',
    description: `Write a C program that counts the number of vowels and consonants in a given string.

Consider only alphabetic characters (a-z, A-Z). Use ctype.h functions like isalpha() and tolower() for character checking.

Vowels are: a, e, i, o, u (both uppercase and lowercase)`,
    difficulty: 'medium',
    allowedLanguages: ['c'],
    constraints: '1 ≤ length of string ≤ 100',
    inputFormat: 'A single line of text (may contain spaces and special characters)',
    outputFormat: 'Print two space-separated integers: count of vowels and count of consonants',
    sampleInput: 'Hello World',
    sampleOutput: '3 7',
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ['strings', 'ctype.h', 'loops', 'conditionals'],
    testCases: [
      { input: 'Hello World', expectedOutput: '3 7', isHidden: false },
      { input: 'Programming', expectedOutput: '3 8', isHidden: false },
      { input: 'AEIOU', expectedOutput: '5 0', isHidden: true },
      { input: 'xyz', expectedOutput: '0 3', isHidden: true },
      { input: 'a1b2c3', expectedOutput: '1 2', isHidden: true }
    ]
  },
  {
    title: 'Array Maximum and Minimum',
    description: `Write a C program that finds the maximum and minimum elements in an array of integers.

First, read the size of the array, then read the array elements.`,
    difficulty: 'medium',
    allowedLanguages: ['c'],
    constraints: '1 ≤ n ≤ 1000, -10^6 ≤ array elements ≤ 10^6',
    inputFormat: 'First line: integer n (size of array)\\nSecond line: n space-separated integers',
    outputFormat: 'Print two space-separated integers: maximum and minimum values',
    sampleInput: '5\n3 1 4 1 5',
    sampleOutput: '5 1',
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ['arrays', 'loops', 'stdlib.h'],
    testCases: [
      { input: '5\n3 1 4 1 5', expectedOutput: '5 1', isHidden: false },
      { input: '3\n10 20 30', expectedOutput: '30 10', isHidden: false },
      { input: '1\n42', expectedOutput: '42 42', isHidden: true },
      { input: '4\n-5 -2 -8 -1', expectedOutput: '-1 -8', isHidden: true }
    ]
  },
  {
    title: 'Fibonacci Series',
    description: `Write a C program that prints the first n terms of the Fibonacci sequence.

The Fibonacci sequence starts with 0 and 1, and each subsequent number is the sum of the two preceding ones.

Sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, ...`,
    difficulty: 'medium',
    allowedLanguages: ['c'],
    constraints: '1 ≤ n ≤ 30',
    inputFormat: 'A single integer n',
    outputFormat: 'Print the first n Fibonacci numbers separated by spaces',
    sampleInput: '7',
    sampleOutput: '0 1 1 2 3 5 8',
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ['loops', 'fibonacci', 'sequences'],
    testCases: [
      { input: '7', expectedOutput: '0 1 1 2 3 5 8', isHidden: false },
      { input: '1', expectedOutput: '0', isHidden: false },
      { input: '2', expectedOutput: '0 1', isHidden: true },
      { input: '10', expectedOutput: '0 1 1 2 3 5 8 13 21 34', isHidden: true }
    ]
  },
  {
    title: 'Bubble Sort Implementation',
    description: `Write a C program that sorts an array of integers in ascending order using the Bubble Sort algorithm.

Bubble Sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.

Algorithm:
1. Compare each pair of adjacent elements
2. Swap them if they are in wrong order
3. Repeat until no swaps are needed`,
    difficulty: 'hard',
    allowedLanguages: ['c'],
    constraints: '1 ≤ n ≤ 1000, -10^6 ≤ array elements ≤ 10^6',
    inputFormat: 'First line: integer n (size of array)\\nSecond line: n space-separated integers',
    outputFormat: 'Print the sorted array elements separated by spaces',
    sampleInput: '5\n64 34 25 12 22',
    sampleOutput: '12 22 25 34 64',
    timeLimit: 2000,
    memoryLimit: 128,
    tags: ['arrays', 'sorting', 'bubble-sort', 'algorithms'],
    testCases: [
      { input: '5\n64 34 25 12 22', expectedOutput: '12 22 25 34 64', isHidden: false },
      { input: '3\n3 2 1', expectedOutput: '1 2 3', isHidden: false },
      { input: '1\n5', expectedOutput: '5', isHidden: true },
      { input: '4\n1 2 3 4', expectedOutput: '1 2 3 4', isHidden: true },
      { input: '6\n-5 0 3 -2 8 1', expectedOutput: '-5 -2 0 1 3 8', isHidden: true }
    ]
  }
];

const seedProblems = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an admin user to set as creator
    const admin = await User.findOne({ role: 'admin' });
    
    // Clear existing sample problems (optional - comment out if you want to keep existing)
    await SampleProblem.deleteMany({});
    console.log('Cleared existing sample problems');

    // Add createdBy field if admin exists
    const problemsToInsert = cPracticeProblems.map(problem => ({
      ...problem,
      createdBy: admin?._id || null
    }));

    // Insert problems
    const inserted = await SampleProblem.insertMany(problemsToInsert);
    
    console.log('\\n✅ Successfully inserted ' + inserted.length + ' practice problems!\\n');
    console.log('Problems added:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    inserted.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} (${p.difficulty})`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding problems:', error.message);
    process.exit(1);
  }
};

seedProblems();
