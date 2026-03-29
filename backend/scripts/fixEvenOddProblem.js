import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import CompetitionProblem from '../models/CompetitionProblem.js';

dotenv.config();

const fixEvenOddProblem = async () => {
  try {
    await connectDB();
    
    console.log('Finding "Even or Odd" problem...');
    
    const problem = await CompetitionProblem.findOne({ 
      title: 'Even or Odd',
      isShared: true
    });

    if (!problem) {
      console.log('❌ Problem not found');
      process.exit(1);
    }

    console.log('✓ Found problem, updating test cases...');

    // Update the problem with correct test cases
    problem.description = `Write a C program that determines whether a given integer is even or odd.

Use the modulo operator (%) to check if a number is divisible by 2.`;
    problem.outputFormat = 'Print "Even" if n is even, otherwise print "Odd"';
    problem.sampleOutput = 'Even';
    problem.testCases = [
      { input: '4', expectedOutput: 'Even', isHidden: false, points: 10 },
      { input: '7', expectedOutput: 'Odd', isHidden: true, points: 10 },
      { input: '0', expectedOutput: 'Even', isHidden: true, points: 10 },
      { input: '-3', expectedOutput: 'Odd', isHidden: true, points: 10 },
      { input: '100', expectedOutput: 'Even', isHidden: true, points: 10 }
    ];

    await problem.save();

    console.log('✅ Problem updated successfully!');
    console.log('\nUpdated test cases:');
    problem.testCases.forEach((tc, i) => {
      console.log(`  ${i + 1}. Input: "${tc.input}" → Expected: "${tc.expectedOutput}"`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating problem:', error);
    process.exit(1);
  }
};

fixEvenOddProblem();
