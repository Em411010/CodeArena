import CompetitionProblem from '../models/CompetitionProblem.js';

const defaultProblems = [
  {
    title: 'Sum of Two Numbers',
    difficulty: 'easy',
    maxScore: 50,
    description: `Write a C program that reads two integers from the input and prints their sum.

Your program should:
- Read two integers separated by a space or newline
- Calculate their sum
- Print the result as a single integer`,
    constraints: '- -1000 ≤ a, b ≤ 1000',
    inputFormat: 'Two integers a and b separated by space or newline',
    outputFormat: 'A single integer representing the sum of a and b',
    sampleInput: '5 3',
    sampleOutput: '8',
    allowedLanguages: ['c'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '5 3', expectedOutput: '8', isHidden: false, points: 10 },
      { input: '10 20', expectedOutput: '30', isHidden: true, points: 10 },
      { input: '-5 5', expectedOutput: '0', isHidden: true, points: 10 },
      { input: '0 0', expectedOutput: '0', isHidden: true, points: 10 },
      { input: '100 200', expectedOutput: '300', isHidden: true, points: 10 }
    ]
  },
  {
    title: 'Find Maximum Number',
    difficulty: 'easy',
    maxScore: 50,
    description: `Write a C program that reads three integers and prints the largest one.

Your program should:
- Read three integers
- Find the maximum among them
- Print the maximum value`,
    constraints: '- -1000 ≤ a, b, c ≤ 1000',
    inputFormat: 'Three integers a, b, and c separated by spaces',
    outputFormat: 'A single integer representing the maximum value',
    sampleInput: '5 10 3',
    sampleOutput: '10',
    allowedLanguages: ['c'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '5 10 3', expectedOutput: '10', isHidden: false, points: 10 },
      { input: '1 2 3', expectedOutput: '3', isHidden: true, points: 10 },
      { input: '100 50 75', expectedOutput: '100', isHidden: true, points: 10 },
      { input: '-5 -10 -3', expectedOutput: '-3', isHidden: true, points: 10 },
      { input: '0 0 0', expectedOutput: '0', isHidden: true, points: 10 }
    ]
  },
  {
    title: 'Even or Odd',
    difficulty: 'easy',
    maxScore: 50,
    description: `Write a C program that reads an integer and determines if it is even or odd.

Your program should:
- Read one integer
- Check if it is even or odd
- Print "EVEN" if the number is even, or "ODD" if the number is odd`,
    constraints: '- -10000 ≤ n ≤ 10000',
    inputFormat: 'A single integer n',
    outputFormat: 'Print "EVEN" or "ODD" (without quotes)',
    sampleInput: '4',
    sampleOutput: 'EVEN',
    allowedLanguages: ['c'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '4', expectedOutput: 'EVEN', isHidden: false, points: 10 },
      { input: '7', expectedOutput: 'ODD', isHidden: true, points: 10 },
      { input: '0', expectedOutput: 'EVEN', isHidden: true, points: 10 },
      { input: '-3', expectedOutput: 'ODD', isHidden: true, points: 10 },
      { input: '100', expectedOutput: 'EVEN', isHidden: true, points: 10 }
    ]
  },
  {
    title: 'Calculate Average',
    difficulty: 'easy',
    maxScore: 50,
    description: `Write a C program that reads three numbers and calculates their average.

Your program should:
- Read three integers
- Calculate their average
- Print the average as a floating-point number with 2 decimal places`,
    constraints: '- 0 ≤ a, b, c ≤ 100',
    inputFormat: 'Three integers a, b, and c separated by spaces',
    outputFormat: 'The average as a floating-point number with 2 decimal places',
    sampleInput: '10 20 30',
    sampleOutput: '20.00',
    allowedLanguages: ['c'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: '10 20 30', expectedOutput: '20.00', isHidden: false, points: 10 },
      { input: '5 5 5', expectedOutput: '5.00', isHidden: true, points: 10 },
      { input: '0 0 0', expectedOutput: '0.00', isHidden: true, points: 10 },
      { input: '15 25 35', expectedOutput: '25.00', isHidden: true, points: 10 },
      { input: '100 50 75', expectedOutput: '75.00', isHidden: true, points: 10 }
    ]
  },
  {
    title: 'Count Vowels',
    difficulty: 'easy',
    maxScore: 50,
    description: `Write a C program that reads a string and counts the number of vowels (a, e, i, o, u) in it.

Your program should:
- Read a string (single line, may contain spaces)
- Count all vowels (both uppercase and lowercase)
- Print the total count`,
    constraints: '- String length ≤ 1000 characters\n- Count both uppercase and lowercase vowels',
    inputFormat: 'A single line string',
    outputFormat: 'A single integer representing the number of vowels',
    sampleInput: 'Hello World',
    sampleOutput: '3',
    allowedLanguages: ['c'],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: 'Hello World', expectedOutput: '3', isHidden: false, points: 10 },
      { input: 'aeiou', expectedOutput: '5', isHidden: true, points: 10 },
      { input: 'AEIOU', expectedOutput: '5', isHidden: true, points: 10 },
      { input: 'bcdfg', expectedOutput: '0', isHidden: true, points: 10 },
      { input: 'Programming is fun', expectedOutput: '5', isHidden: true, points: 10 }
    ]
  }
];

export const seedDefaultProblemsForTeacher = async (teacherId) => {
  try {
    console.log(`Seeding default problems for teacher: ${teacherId}`);
    
    // Check if teacher already has these problems
    const existingProblems = await CompetitionProblem.find({
      createdBy: teacherId,
      title: { $in: defaultProblems.map(p => p.title) }
    });

    const existingTitles = existingProblems.map(p => p.title);
    const problemsToCreate = defaultProblems.filter(p => !existingTitles.includes(p.title));

    if (problemsToCreate.length === 0) {
      console.log('Teacher already has all default problems');
      return;
    }

    console.log(`Creating ${problemsToCreate.length} default problems...`);

    for (const problemData of problemsToCreate) {
      await CompetitionProblem.create({
        ...problemData,
        createdBy: teacherId
      });
      console.log(`✓ Created: ${problemData.title}`);
    }

    console.log('Default problems seeded successfully');
  } catch (error) {
    console.error('Error seeding default problems:', error);
    throw error;
  }
};
