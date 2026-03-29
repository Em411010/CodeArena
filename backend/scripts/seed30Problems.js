import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import CompetitionProblem from '../models/CompetitionProblem.js';
import User from '../models/User.js';

dotenv.config();

const problems = [
  // ─── Category 1: Ad-hoc Problem Solving ───────────────────────────────────

  {
    title: 'The Palindrome Checker',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given a string, determine if it is a palindrome (reads the same forwards and backwards). Ignore case.`,
    constraints: '1 ≤ length ≤ 100\nOnly printable ASCII characters',
    inputFormat: 'A single line string',
    outputFormat: 'Print "YES" if palindrome, otherwise "NO"',
    sampleInput: 'racecar',
    sampleOutput: 'YES',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: 'racecar',  expectedOutput: 'YES', isHidden: false, points: 10 },
      { input: 'hello',    expectedOutput: 'NO',  isHidden: true,  points: 10 },
      { input: 'Level',    expectedOutput: 'YES', isHidden: true,  points: 10 },
      { input: 'abcba',    expectedOutput: 'YES', isHidden: true,  points: 10 },
      { input: 'world',    expectedOutput: 'NO',  isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'String Compression 101',
    difficulty: 'medium',
    maxScore: 75,
    description: `Compress a string using run-length encoding. For each group of consecutive identical characters, output the character followed by its count. If the compressed string is not shorter than the original, output the original string.`,
    constraints: '1 ≤ length ≤ 200\nOnly lowercase letters',
    inputFormat: 'A single line string of lowercase letters',
    outputFormat: 'The compressed string, or original if compression is not shorter',
    sampleInput: 'aabcccdddd',
    sampleOutput: 'a2b1c3d4',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: 'aabcccdddd',  expectedOutput: 'a2b1c3d4',  isHidden: false, points: 15 },
      { input: 'abcd',        expectedOutput: 'abcd',       isHidden: true,  points: 15 },
      { input: 'aaaa',        expectedOutput: 'a4',         isHidden: true,  points: 15 },
      { input: 'aabbcc',      expectedOutput: 'aabbcc',     isHidden: true,  points: 15 },
      { input: 'aaabbbccc',   expectedOutput: 'a3b3c3',     isHidden: true,  points: 15 },
    ],
  },

  {
    title: 'The Vowel and Consonant Counter',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given a string, count the number of vowels (a, e, i, o, u) and consonants (alphabetic characters that are not vowels). Ignore case and non-alphabetic characters.`,
    constraints: '1 ≤ length ≤ 200',
    inputFormat: 'A single line string',
    outputFormat: 'Two integers on one line: vowels consonants',
    sampleInput: 'Hello World',
    sampleOutput: '3 7',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: 'Hello World',   expectedOutput: '3 7', isHidden: false, points: 10 },
      { input: 'aeiou',         expectedOutput: '5 0', isHidden: true,  points: 10 },
      { input: 'bcdfg',         expectedOutput: '0 5', isHidden: true,  points: 10 },
      { input: 'Programming',   expectedOutput: '3 8', isHidden: true,  points: 10 },
      { input: '12345',         expectedOutput: '0 0', isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'Diamond Pattern Printer',
    difficulty: 'medium',
    maxScore: 75,
    description: `Given an odd number n, print a diamond pattern of asterisks with the widest row having n asterisks.`,
    constraints: '1 ≤ n ≤ 9\nn is always odd',
    inputFormat: 'A single odd integer n',
    outputFormat: 'The diamond pattern using * characters',
    sampleInput: '5',
    sampleOutput: '  *\n ***\n*****\n ***\n  *',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '1', expectedOutput: '*',                             isHidden: false, points: 15 },
      { input: '3', expectedOutput: ' *\n***\n *',                  isHidden: true,  points: 15 },
      { input: '5', expectedOutput: '  *\n ***\n*****\n ***\n  *',  isHidden: true,  points: 15 },
      { input: '7', expectedOutput: '   *\n  ***\n *****\n*******\n *****\n  ***\n   *', isHidden: true, points: 15 },
      { input: '9', expectedOutput: '    *\n   ***\n  *****\n *******\n*********\n *******\n  *****\n   ***\n    *', isHidden: true, points: 15 },
    ],
  },

  {
    title: 'Caesar Cipher Encoder',
    difficulty: 'medium',
    maxScore: 75,
    description: `Encode a message using the Caesar cipher with a given shift. Shift only alphabetic characters, preserving case. Wrap around at the end of the alphabet.`,
    constraints: '0 ≤ shift ≤ 25\n1 ≤ message length ≤ 200',
    inputFormat: 'First line: shift value\nSecond line: the message',
    outputFormat: 'The encoded message',
    sampleInput: '3\nHello',
    sampleOutput: 'Khoor',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '3\nHello',       expectedOutput: 'Khoor',       isHidden: false, points: 15 },
      { input: '1\nABC',         expectedOutput: 'BCD',         isHidden: true,  points: 15 },
      { input: '13\nHello',      expectedOutput: 'Uryyb',       isHidden: true,  points: 15 },
      { input: '0\nTest',        expectedOutput: 'Test',        isHidden: true,  points: 15 },
      { input: '25\nABC',        expectedOutput: 'ZAB',         isHidden: true,  points: 15 },
    ],
  },

  {
    title: 'Word Reversal Challenge',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given a sentence, reverse each word individually while keeping the word order the same.`,
    constraints: '1 ≤ number of words ≤ 20\nOnly alphabetic words separated by single spaces',
    inputFormat: 'A single line sentence',
    outputFormat: 'The sentence with each word reversed',
    sampleInput: 'Hello World',
    sampleOutput: 'olleH dlroW',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: 'Hello World',        expectedOutput: 'olleH dlroW',       isHidden: false, points: 10 },
      { input: 'I love coding',      expectedOutput: 'I evol gnidoc',     isHidden: true,  points: 10 },
      { input: 'abc',                expectedOutput: 'cba',               isHidden: true,  points: 10 },
      { input: 'racecar',            expectedOutput: 'racecar',           isHidden: true,  points: 10 },
      { input: 'The quick brown',    expectedOutput: 'ehT kciuq nworb',   isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'The Unique Character Finder',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given a string, find the index (0-based) of the first non-repeating character. If all characters repeat, output -1.`,
    constraints: '1 ≤ length ≤ 200\nOnly lowercase letters',
    inputFormat: 'A single line string of lowercase letters',
    outputFormat: 'A single integer: index of first unique character, or -1',
    sampleInput: 'aabbcde',
    sampleOutput: '4',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: 'aabbcde', expectedOutput: '4',  isHidden: false, points: 10 },
      { input: 'aabb',    expectedOutput: '-1', isHidden: true,  points: 10 },
      { input: 'abcabc',  expectedOutput: '-1', isHidden: true,  points: 10 },
      { input: 'abcd',    expectedOutput: '0',  isHidden: true,  points: 10 },
      { input: 'aabbc',   expectedOutput: '4',  isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'Matrix Transposition',
    difficulty: 'medium',
    maxScore: 75,
    description: `Given an N×M matrix of integers, output its transpose (an M×N matrix).`,
    constraints: '1 ≤ N, M ≤ 10',
    inputFormat: 'First line: N M\nNext N lines: M space-separated integers each',
    outputFormat: 'M lines of N space-separated integers each (the transpose)',
    sampleInput: '2 3\n1 2 3\n4 5 6',
    sampleOutput: '1 4\n2 5\n3 6',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '2 3\n1 2 3\n4 5 6',          expectedOutput: '1 4\n2 5\n3 6',     isHidden: false, points: 15 },
      { input: '1 1\n5',                       expectedOutput: '5',                isHidden: true,  points: 15 },
      { input: '3 3\n1 2 3\n4 5 6\n7 8 9',    expectedOutput: '1 4 7\n2 5 8\n3 6 9', isHidden: true, points: 15 },
      { input: '1 3\n10 20 30',               expectedOutput: '10\n20\n30',        isHidden: true,  points: 15 },
      { input: '3 2\n1 2\n3 4\n5 6',          expectedOutput: '1 3 5\n2 4 6',      isHidden: true,  points: 15 },
    ],
  },

  {
    title: 'Anagram Detector',
    difficulty: 'easy',
    maxScore: 50,
    description: `Determine if two given strings are anagrams of each other. Two strings are anagrams if they contain the same characters in any order. Ignore case.`,
    constraints: '1 ≤ length ≤ 100\nOnly alphabetic characters',
    inputFormat: 'Two strings, one per line',
    outputFormat: 'Print "YES" if anagrams, otherwise "NO"',
    sampleInput: 'listen\nsilent',
    sampleOutput: 'YES',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: 'listen\nsilent',   expectedOutput: 'YES', isHidden: false, points: 10 },
      { input: 'hello\nworld',     expectedOutput: 'NO',  isHidden: true,  points: 10 },
      { input: 'Triangle\nIntegral', expectedOutput: 'YES', isHidden: true, points: 10 },
      { input: 'abc\nabc',         expectedOutput: 'YES', isHidden: true,  points: 10 },
      { input: 'abc\ndef',         expectedOutput: 'NO',  isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'The Robot Grid Navigator',
    difficulty: 'medium',
    maxScore: 75,
    description: `A robot starts at position (0, 0) facing North. Given a sequence of commands (L=turn left, R=turn right, F=move forward 1 step), output the final (x, y) position of the robot.`,
    constraints: '1 ≤ commands length ≤ 200',
    inputFormat: 'A string of commands using characters L, R, F',
    outputFormat: 'Two integers x y representing the final position',
    sampleInput: 'FFRFF',
    sampleOutput: '2 2',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: 'FFRFF',       expectedOutput: '2 2',  isHidden: false, points: 15 },
      { input: 'F',           expectedOutput: '0 1',  isHidden: true,  points: 15 },
      { input: 'FFFFLFFFF',   expectedOutput: '-4 4', isHidden: true,  points: 15 },
      { input: 'LFLFLFLF',   expectedOutput: '0 0',  isHidden: true,  points: 15 },
      { input: 'RFRFRF',     expectedOutput: '0 -1', isHidden: true,  points: 15 },
    ],
  },

  // ─── Category 2: Mathematics ──────────────────────────────────────────────

  {
    title: 'Prime Number Seeker (Sieve)',
    difficulty: 'medium',
    maxScore: 75,
    description: `Given a number N, print all prime numbers from 2 to N (inclusive) using the Sieve of Eratosthenes, each on a new line.`,
    constraints: '2 ≤ N ≤ 100',
    inputFormat: 'A single integer N',
    outputFormat: 'All primes from 2 to N, one per line',
    sampleInput: '10',
    sampleOutput: '2\n3\n5\n7',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '10',  expectedOutput: '2\n3\n5\n7',                   isHidden: false, points: 15 },
      { input: '2',   expectedOutput: '2',                             isHidden: true,  points: 15 },
      { input: '20',  expectedOutput: '2\n3\n5\n7\n11\n13\n17\n19',   isHidden: true,  points: 15 },
      { input: '5',   expectedOutput: '2\n3\n5',                       isHidden: true,  points: 15 },
      { input: '30',  expectedOutput: '2\n3\n5\n7\n11\n13\n17\n19\n23\n29', isHidden: true, points: 15 },
    ],
  },

  {
    title: 'Greatest Common Divisor (GCD)',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given two positive integers, compute their Greatest Common Divisor (GCD) using the Euclidean algorithm.`,
    constraints: '1 ≤ a, b ≤ 10^6',
    inputFormat: 'Two integers a and b on a single line',
    outputFormat: 'A single integer: the GCD of a and b',
    sampleInput: '48 18',
    sampleOutput: '6',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '48 18',   expectedOutput: '6',  isHidden: false, points: 10 },
      { input: '100 75',  expectedOutput: '25', isHidden: true,  points: 10 },
      { input: '7 3',     expectedOutput: '1',  isHidden: true,  points: 10 },
      { input: '0 5',     expectedOutput: '5',  isHidden: true,  points: 10 },
      { input: '12 12',   expectedOutput: '12', isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'Least Common Multiple (LCM)',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given two positive integers, compute their Least Common Multiple (LCM). LCM(a,b) = a*b / GCD(a,b).`,
    constraints: '1 ≤ a, b ≤ 10^4',
    inputFormat: 'Two integers a and b on a single line',
    outputFormat: 'A single integer: the LCM of a and b',
    sampleInput: '4 6',
    sampleOutput: '12',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '4 6',   expectedOutput: '12',  isHidden: false, points: 10 },
      { input: '5 7',   expectedOutput: '35',  isHidden: true,  points: 10 },
      { input: '3 9',   expectedOutput: '9',   isHidden: true,  points: 10 },
      { input: '12 15', expectedOutput: '60',  isHidden: true,  points: 10 },
      { input: '1 1',   expectedOutput: '1',   isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'The Factorial Calculator',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given a non-negative integer n, compute and print n! (n factorial).`,
    constraints: '0 ≤ n ≤ 12',
    inputFormat: 'A single integer n',
    outputFormat: 'A single integer: n!',
    sampleInput: '5',
    sampleOutput: '120',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '5',  expectedOutput: '120',        isHidden: false, points: 10 },
      { input: '0',  expectedOutput: '1',          isHidden: true,  points: 10 },
      { input: '1',  expectedOutput: '1',          isHidden: true,  points: 10 },
      { input: '10', expectedOutput: '3628800',    isHidden: true,  points: 10 },
      { input: '12', expectedOutput: '479001600',  isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'Fibonacci Sequence Generator',
    difficulty: 'easy',
    maxScore: 50,
    description: `Print the first N numbers of the Fibonacci sequence, each on a new line. The sequence starts: 0, 1, 1, 2, 3, 5, 8, ...`,
    constraints: '1 ≤ N ≤ 20',
    inputFormat: 'A single integer N',
    outputFormat: 'The first N Fibonacci numbers, one per line',
    sampleInput: '6',
    sampleOutput: '0\n1\n1\n2\n3\n5',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '1',  expectedOutput: '0',                       isHidden: false, points: 10 },
      { input: '6',  expectedOutput: '0\n1\n1\n2\n3\n5',        isHidden: true,  points: 10 },
      { input: '2',  expectedOutput: '0\n1',                    isHidden: true,  points: 10 },
      { input: '8',  expectedOutput: '0\n1\n1\n2\n3\n5\n8\n13', isHidden: true,  points: 10 },
      { input: '10', expectedOutput: '0\n1\n1\n2\n3\n5\n8\n13\n21\n34', isHidden: true, points: 10 },
    ],
  },

  {
    title: 'Binary to Decimal Converter',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given a binary number as a string, convert it to its decimal equivalent.`,
    constraints: '1 ≤ binary string length ≤ 20\nInput contains only 0s and 1s',
    inputFormat: 'A string representing a binary number',
    outputFormat: 'A single integer: the decimal value',
    sampleInput: '1010',
    sampleOutput: '10',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '1010',             expectedOutput: '10',    isHidden: false, points: 10 },
      { input: '0',                expectedOutput: '0',     isHidden: true,  points: 10 },
      { input: '1',                expectedOutput: '1',     isHidden: true,  points: 10 },
      { input: '11111111',         expectedOutput: '255',   isHidden: true,  points: 10 },
      { input: '10000000000',      expectedOutput: '1024',  isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'Area of Irregular Polygons',
    difficulty: 'medium',
    maxScore: 75,
    description: `Given the coordinates of the vertices of a polygon in order, compute its area using the Shoelace formula. Print the result rounded to 2 decimal places.`,
    constraints: '3 ≤ N ≤ 10\n-1000 ≤ x, y ≤ 1000',
    inputFormat: 'First line: N (number of vertices)\nNext N lines: x y coordinates',
    outputFormat: 'The area rounded to 2 decimal places',
    sampleInput: '4\n0 0\n4 0\n4 3\n0 3',
    sampleOutput: '12.00',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '4\n0 0\n4 0\n4 3\n0 3',            expectedOutput: '12.00', isHidden: false, points: 15 },
      { input: '3\n0 0\n4 0\n0 3',                  expectedOutput: '6.00',  isHidden: true,  points: 15 },
      { input: '5\n0 0\n2 0\n3 2\n1 4\n-1 2',       expectedOutput: '8.00',  isHidden: true,  points: 15 },
      { input: '3\n1 1\n4 1\n1 5',                   expectedOutput: '6.00',  isHidden: true,  points: 15 },
      { input: '4\n0 0\n1 0\n1 1\n0 1',             expectedOutput: '1.00',  isHidden: true,  points: 15 },
    ],
  },

  {
    title: 'The Sum of Digits',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given a positive integer, compute the sum of its digits.`,
    constraints: '0 ≤ n ≤ 10^9',
    inputFormat: 'A single non-negative integer n',
    outputFormat: 'A single integer: the sum of digits of n',
    sampleInput: '12345',
    sampleOutput: '15',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '12345',      expectedOutput: '15', isHidden: false, points: 10 },
      { input: '0',          expectedOutput: '0',  isHidden: true,  points: 10 },
      { input: '999',        expectedOutput: '27', isHidden: true,  points: 10 },
      { input: '100',        expectedOutput: '1',  isHidden: true,  points: 10 },
      { input: '1000000000', expectedOutput: '1',  isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'Leap Year Validator',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given a year, determine if it is a leap year. A year is a leap year if: it is divisible by 4, except for century years which must be divisible by 400.`,
    constraints: '1 ≤ year ≤ 9999',
    inputFormat: 'A single integer: the year',
    outputFormat: 'Print "YES" if leap year, otherwise "NO"',
    sampleInput: '2000',
    sampleOutput: 'YES',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '2000', expectedOutput: 'YES', isHidden: false, points: 10 },
      { input: '1900', expectedOutput: 'NO',  isHidden: true,  points: 10 },
      { input: '2024', expectedOutput: 'YES', isHidden: true,  points: 10 },
      { input: '2023', expectedOutput: 'NO',  isHidden: true,  points: 10 },
      { input: '400',  expectedOutput: 'YES', isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'Quadratic Equation Solver',
    difficulty: 'medium',
    maxScore: 75,
    description: `Solve the quadratic equation ax^2 + bx + c = 0. Print the roots rounded to 2 decimal places, or "No real roots" if the discriminant is negative.`,
    constraints: '-100 ≤ a, b, c ≤ 100\na ≠ 0',
    inputFormat: 'Three integers a b c on a single line',
    outputFormat: 'If two distinct roots: "x1=<val> x2=<val>" with smaller root first\nIf one root: "x1=<val>"\nIf no real roots: "No real roots"',
    sampleInput: '1 -5 6',
    sampleOutput: 'x1=2.00 x2=3.00',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '1 -5 6',   expectedOutput: 'x1=2.00 x2=3.00', isHidden: false, points: 15 },
      { input: '1 -2 1',   expectedOutput: 'x1=1.00',          isHidden: true,  points: 15 },
      { input: '1 0 1',    expectedOutput: 'No real roots',     isHidden: true,  points: 15 },
      { input: '2 4 -6',   expectedOutput: 'x1=-3.00 x2=1.00', isHidden: true,  points: 15 },
      { input: '1 1 -6',   expectedOutput: 'x1=-3.00 x2=2.00', isHidden: true,  points: 15 },
    ],
  },

  // ─── Category 3: Data Structures & Algorithms ─────────────────────────────

  {
    title: 'Binary Search Implementation',
    difficulty: 'medium',
    maxScore: 75,
    description: `Given a sorted array of N integers and a target value, find the index (0-based) of the target using binary search. If not found, output -1.`,
    constraints: '1 ≤ N ≤ 100\n-10^6 ≤ values ≤ 10^6',
    inputFormat: 'First line: N\nSecond line: N sorted integers\nThird line: target integer',
    outputFormat: 'A single integer: index of target, or -1',
    sampleInput: '5\n1 3 5 7 9\n7',
    sampleOutput: '3',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '5\n1 3 5 7 9\n7',    expectedOutput: '3',  isHidden: false, points: 15 },
      { input: '5\n1 3 5 7 9\n6',    expectedOutput: '-1', isHidden: true,  points: 15 },
      { input: '1\n42\n42',          expectedOutput: '0',  isHidden: true,  points: 15 },
      { input: '4\n10 20 30 40\n10', expectedOutput: '0',  isHidden: true,  points: 15 },
      { input: '4\n10 20 30 40\n40', expectedOutput: '3',  isHidden: true,  points: 15 },
    ],
  },

  {
    title: 'Selection Sort Specialist',
    difficulty: 'easy',
    maxScore: 50,
    description: `Sort an array of N integers in ascending order using selection sort. Print the sorted array on a single line, space-separated.`,
    constraints: '1 ≤ N ≤ 20\n-1000 ≤ values ≤ 1000',
    inputFormat: 'First line: N\nSecond line: N integers',
    outputFormat: 'Sorted integers on a single line, space-separated',
    sampleInput: '5\n64 25 12 22 11',
    sampleOutput: '11 12 22 25 64',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '5\n64 25 12 22 11',   expectedOutput: '11 12 22 25 64',  isHidden: false, points: 10 },
      { input: '1\n5',               expectedOutput: '5',                isHidden: true,  points: 10 },
      { input: '4\n-3 -1 -4 -2',     expectedOutput: '-4 -3 -2 -1',     isHidden: true,  points: 10 },
      { input: '3\n5 5 5',           expectedOutput: '5 5 5',            isHidden: true,  points: 10 },
      { input: '6\n3 1 4 1 5 2',     expectedOutput: '1 1 2 3 4 5',     isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'Frequency Array Finder',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given an array of N integers (between 1 and 100), print the frequency of each distinct value in ascending order of the value.`,
    constraints: '1 ≤ N ≤ 100\n1 ≤ values ≤ 100',
    inputFormat: 'First line: N\nSecond line: N integers',
    outputFormat: 'For each distinct value (ascending): "value: count"',
    sampleInput: '6\n3 1 2 3 1 3',
    sampleOutput: '1: 2\n2: 1\n3: 3',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '6\n3 1 2 3 1 3',     expectedOutput: '1: 2\n2: 1\n3: 3',        isHidden: false, points: 10 },
      { input: '3\n5 5 5',           expectedOutput: '5: 3',                     isHidden: true,  points: 10 },
      { input: '4\n1 2 3 4',         expectedOutput: '1: 1\n2: 1\n3: 1\n4: 1',  isHidden: true,  points: 10 },
      { input: '1\n7',               expectedOutput: '7: 1',                     isHidden: true,  points: 10 },
      { input: '5\n2 2 1 1 1',       expectedOutput: '1: 3\n2: 2',              isHidden: true,  points: 10 },
    ],
  },

  {
    title: 'Parentheses Balancer',
    difficulty: 'medium',
    maxScore: 75,
    description: `Given a string containing only '(' and ')', determine if the parentheses are balanced (every opening bracket has a matching closing bracket in the correct order).`,
    constraints: '1 ≤ length ≤ 100',
    inputFormat: 'A single string of parentheses',
    outputFormat: 'Print "BALANCED" if balanced, otherwise "UNBALANCED"',
    sampleInput: '((()))',
    sampleOutput: 'BALANCED',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '((()))',   expectedOutput: 'BALANCED',   isHidden: false, points: 15 },
      { input: '(()',      expectedOutput: 'UNBALANCED', isHidden: true,  points: 15 },
      { input: '()',       expectedOutput: 'BALANCED',   isHidden: true,  points: 15 },
      { input: ')(',       expectedOutput: 'UNBALANCED', isHidden: true,  points: 15 },
      { input: '(()())',   expectedOutput: 'BALANCED',   isHidden: true,  points: 15 },
    ],
  },

  {
    title: 'Queue Simulation: FIFO Basics',
    difficulty: 'medium',
    maxScore: 75,
    description: `Simulate a queue with ENQUEUE and DEQUEUE operations. For each DEQUEUE, print the removed element. For DEQUEUE on an empty queue, print "EMPTY".`,
    constraints: '1 ≤ number of operations ≤ 20',
    inputFormat: 'First line: number of operations\nEach subsequent line: "ENQUEUE x" or "DEQUEUE"',
    outputFormat: 'For each DEQUEUE: print the value removed, or "EMPTY"',
    sampleInput: '4\nENQUEUE 5\nENQUEUE 10\nDEQUEUE\nDEQUEUE',
    sampleOutput: '5\n10',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '4\nENQUEUE 5\nENQUEUE 10\nDEQUEUE\nDEQUEUE',  expectedOutput: '5\n10',    isHidden: false, points: 15 },
      { input: '2\nDEQUEUE\nDEQUEUE',                          expectedOutput: 'EMPTY\nEMPTY', isHidden: true, points: 15 },
      { input: '3\nENQUEUE 1\nDEQUEUE\nDEQUEUE',               expectedOutput: '1\nEMPTY', isHidden: true,  points: 15 },
      { input: '5\nENQUEUE 3\nENQUEUE 7\nENQUEUE 2\nDEQUEUE\nDEQUEUE', expectedOutput: '3\n7', isHidden: true, points: 15 },
      { input: '3\nENQUEUE 99\nENQUEUE 1\nDEQUEUE',            expectedOutput: '99',       isHidden: true,  points: 15 },
    ],
  },

  {
    title: 'Maximum Subarray Sum (Kadane\'s)',
    difficulty: 'medium',
    maxScore: 75,
    description: `Given an array of N integers, find the maximum sum of any contiguous subarray using Kadane's algorithm.`,
    constraints: '1 ≤ N ≤ 100\n-1000 ≤ values ≤ 1000',
    inputFormat: 'First line: N\nSecond line: N integers',
    outputFormat: 'A single integer: the maximum subarray sum',
    sampleInput: '8\n-2 1 -3 4 -1 2 1 -5',
    sampleOutput: '6',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '8\n-2 1 -3 4 -1 2 1 -5',  expectedOutput: '6',  isHidden: false, points: 15 },
      { input: '1\n-5',                    expectedOutput: '-5', isHidden: true,  points: 15 },
      { input: '4\n1 2 3 4',              expectedOutput: '10', isHidden: true,  points: 15 },
      { input: '5\n-3 -1 -2 -4 -5',      expectedOutput: '-1', isHidden: true,  points: 15 },
      { input: '6\n2 -1 2 3 4 -5',       expectedOutput: '10', isHidden: true,  points: 15 },
    ],
  },

  {
    title: 'Linear Search Speedrun',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given an array of N integers and a target, find ALL indices (0-based) where the target appears. Print them space-separated on one line. If not found, print -1.`,
    constraints: '1 ≤ N ≤ 50\n-1000 ≤ values ≤ 1000',
    inputFormat: 'First line: N\nSecond line: N integers\nThird line: target integer',
    outputFormat: 'Space-separated indices where target appears, or -1 if not found',
    sampleInput: '5\n3 1 4 1 5\n1',
    sampleOutput: '1 3',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '5\n3 1 4 1 5\n1',   expectedOutput: '1 3', isHidden: false, points: 10 },
      { input: '3\n1 2 3\n9',       expectedOutput: '-1',  isHidden: true,  points: 10 },
      { input: '4\n5 5 5 5\n5',     expectedOutput: '0 1 2 3', isHidden: true, points: 10 },
      { input: '1\n7\n7',           expectedOutput: '0',   isHidden: true,  points: 10 },
      { input: '5\n10 20 30 20 10\n20', expectedOutput: '1 3', isHidden: true, points: 10 },
    ],
  },

  {
    title: 'Merging Two Sorted Arrays',
    difficulty: 'medium',
    maxScore: 75,
    description: `Given two sorted arrays, merge them into a single sorted array. Print the result space-separated on one line.`,
    constraints: '1 ≤ N, M ≤ 50\n-1000 ≤ values ≤ 1000',
    inputFormat: 'First line: N M\nSecond line: N sorted integers\nThird line: M sorted integers',
    outputFormat: 'The merged sorted array, space-separated',
    sampleInput: '3 3\n1 3 5\n2 4 6',
    sampleOutput: '1 2 3 4 5 6',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '3 3\n1 3 5\n2 4 6',       expectedOutput: '1 2 3 4 5 6',     isHidden: false, points: 15 },
      { input: '1 1\n1\n2',               expectedOutput: '1 2',             isHidden: true,  points: 15 },
      { input: '2 3\n1 5\n2 3 4',         expectedOutput: '1 2 3 4 5',       isHidden: true,  points: 15 },
      { input: '3 2\n1 2 3\n4 5',         expectedOutput: '1 2 3 4 5',       isHidden: true,  points: 15 },
      { input: '2 2\n-5 0\n-3 1',         expectedOutput: '-5 -3 0 1',       isHidden: true,  points: 15 },
    ],
  },

  {
    title: 'Set Intersection Finder',
    difficulty: 'medium',
    maxScore: 75,
    description: `Given two arrays, find the intersection — elements that appear in BOTH arrays (no duplicates). Print the result in ascending order, space-separated. If no intersection, print "EMPTY".`,
    constraints: '1 ≤ N, M ≤ 50\n1 ≤ values ≤ 100',
    inputFormat: 'First line: N M\nSecond line: N integers\nThird line: M integers',
    outputFormat: 'Intersection values in ascending order, or "EMPTY"',
    sampleInput: '4 4\n1 2 3 4\n3 4 5 6',
    sampleOutput: '3 4',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '4 4\n1 2 3 4\n3 4 5 6',     expectedOutput: '3 4',   isHidden: false, points: 15 },
      { input: '3 3\n1 2 3\n4 5 6',         expectedOutput: 'EMPTY', isHidden: true,  points: 15 },
      { input: '3 3\n1 1 2\n1 2 3',         expectedOutput: '1 2',   isHidden: true,  points: 15 },
      { input: '1 1\n5\n5',                 expectedOutput: '5',     isHidden: true,  points: 15 },
      { input: '5 3\n2 4 6 8 10\n1 2 3',    expectedOutput: '2',     isHidden: true,  points: 15 },
    ],
  },

  {
    title: 'The Prefix Sum Array',
    difficulty: 'easy',
    maxScore: 50,
    description: `Given an array of N integers, compute the prefix sum array where prefix[i] = sum of all elements from index 0 to i. Print the prefix sum array space-separated on one line.`,
    constraints: '1 ≤ N ≤ 20\n-100 ≤ values ≤ 100',
    inputFormat: 'First line: N\nSecond line: N integers',
    outputFormat: 'Prefix sum array, space-separated',
    sampleInput: '5\n1 2 3 4 5',
    sampleOutput: '1 3 6 10 15',
    allowedLanguages: ['c', 'python'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '5\n1 2 3 4 5',      expectedOutput: '1 3 6 10 15',        isHidden: false, points: 10 },
      { input: '1\n7',              expectedOutput: '7',                   isHidden: true,  points: 10 },
      { input: '3\n-1 -2 -3',       expectedOutput: '-1 -3 -6',           isHidden: true,  points: 10 },
      { input: '4\n10 0 -5 3',      expectedOutput: '10 10 5 8',          isHidden: true,  points: 10 },
      { input: '6\n1 1 1 1 1 1',    expectedOutput: '1 2 3 4 5 6',        isHidden: true,  points: 10 },
    ],
  },
];

const seed30Problems = async () => {
  try {
    await connectDB();

    console.log('Finding admin user...');
    const admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      console.log('❌ No admin user found. Please create an admin account first.');
      process.exit(1);
    }

    console.log(`Found admin: ${admin.username}`);

    let created = 0;
    let skipped = 0;

    for (const problemData of problems) {
      const exists = await CompetitionProblem.findOne({
        title: problemData.title,
        isShared: true,
      });

      if (exists) {
        console.log(`  ⏭  Skipped (exists): ${problemData.title}`);
        skipped++;
        continue;
      }

      await CompetitionProblem.create({
        ...problemData,
        createdBy: admin._id,
        isShared: true,
      });
      console.log(`  ✓ Created: ${problemData.title}`);
      created++;
    }

    console.log(`\n✅ Done! ${created} problems created, ${skipped} skipped.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding problems:', error);
    process.exit(1);
  }
};

seed30Problems();
