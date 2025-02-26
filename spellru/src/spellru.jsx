import React, { useState, useEffect } from 'react';

const RussianWordGame = () => {
  // Sample Russian letters
  const allLetters = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'.split('');
  
  const [gameLetters, setGameLetters] = useState([]);
  const [centerLetter, setCenterLetter] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [foundWords, setFoundWords] = useState([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Загрузка словаря...');
  const [possibleWords, setPossibleWords] = useState([]);
  const [dictionary, setDictionary] = useState([]);
  const [dictionaryLoaded, setDictionaryLoaded] = useState(false);
  
  // Load the dictionary from the provided URL
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/pptz/rus_dict/refs/heads/main/rus_nouns.txt')
      .then(response => response.text())
      .then(data => {
        const words = data.split(/\r?\n/).filter(word => word.trim().length > 0);
        setDictionary(words);
        setDictionaryLoaded(true);
        setMessage(`Словарь загружен: ${words.length} слов`);
      })
      .catch(error => {
        setMessage('Ошибка при загрузке словаря');
        console.error('Error loading dictionary:', error);
      });
  }, []);
  
  // Initialize the game
  useEffect(() => {
    if (dictionaryLoaded) {
      startNewGame();
    }
  }, [dictionaryLoaded]);
  
  // Function to check if a set of letters can form at least some valid words
  const canFormValidWords = (letters) => {
    let count = 0;
    
    // Use only the center letter as the required letter
    const centerLetter = letters[0]; // We'll always put the center letter first
    const validWords = findPossibleWords(letters, centerLetter);
    
    // If we found at least a few valid words, consider this a good set
    if (validWords.length >= 5) {
      return { isValid: true, wordCount: validWords.length, words: validWords };
    }
    
    return { isValid: false, wordCount: validWords.length };
  };
  
  const generateViableLetterSet = () => {
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops
    let bestResult = { isValid: false, wordCount: 0, letters: [], words: [] };
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Select 7 random letters from the Russian alphabet
      const selectedLetters = [];
      while (selectedLetters.length < 7) {
        const randomIndex = Math.floor(Math.random() * allLetters.length);
        const letter = allLetters[randomIndex];
        if (!selectedLetters.includes(letter)) {
          selectedLetters.push(letter);
        }
      }
      
      // Check if these letters can form valid words
      const result = canFormValidWords(selectedLetters);
      
      // If we found a viable set, use it
      if (result.isValid) {
        return { 
          letters: selectedLetters,
          possibleWords: result.words
        };
      }
      
      // Keep track of the best result so far
      if (result.wordCount > bestResult.wordCount) {
        bestResult = { ...result, letters: [...selectedLetters] };
      }
    }
    
    // If we couldn't find an ideal set, use the best one we found
    console.log("Couldn't find an ideal set, using best available", bestResult);
    return {
      letters: bestResult.letters,
      possibleWords: findPossibleWords(bestResult.letters, bestResult.letters[0])
    };
  };
  
  const startNewGame = () => {
    const { letters, possibleWords } = generateViableLetterSet();
    
    // Always set the center letter as the first letter in the array
    const centerLetter = letters[0];
    
    // Rearrange the letters array, keeping the center letter at index 0
    // This ensures the center letter is first in the array, but will be displayed in center position
    const arrangedLetters = [...letters];
    
    setGameLetters(arrangedLetters);
    setCenterLetter(centerLetter);
    setCurrentWord('');
    setFoundWords([]);
    setScore(0);
    setMessage(`Новая игра началась! Возможных слов: ${possibleWords.length}`);
    setPossibleWords(possibleWords);
  };
  
  const findPossibleWords = (letters, centerLetter) => {
    // Filter the dictionary to find valid words
    return dictionary.filter(word => {
      // Must contain center letter
      if (!word.includes(centerLetter)) return false;
      
      // Must be at least 4 letters
      if (word.length < 4) return false;
      
      // Check if the word can be formed using the available letters
      const wordLetters = word.split('');
      const lettersCopy = [...letters];
      
      for (const char of wordLetters) {
        const index = lettersCopy.indexOf(char);
        if (index === -1) return false;
        lettersCopy[index] = null; // Mark as used without removing (to handle repeated letters)
      }
      
      return true;
    });
  };
  
  const handleLetterClick = (letter) => {
    setCurrentWord(currentWord + letter);
  };
  
  const handleDelete = () => {
    if (currentWord.length > 0) {
      setCurrentWord(currentWord.slice(0, -1));
    }
  };
  
  const handleSubmit = () => {
    // Check if word meets all conditions
    if (currentWord.length < 4) {
      setMessage('Слово должно содержать не менее 4 букв');
      return;
    }
    
    if (!currentWord.includes(centerLetter)) {
      setMessage(`Слово должно содержать букву "${centerLetter}"`);
      return;
    }
    
    if (foundWords.includes(currentWord)) {
      setMessage('Вы уже нашли это слово');
      return;
    }
    
    // Check if it's a valid Russian word
    if (dictionary.includes(currentWord.toLowerCase())) {
      setFoundWords([...foundWords, currentWord]);
      
      // Scoring: 1 point for 4-letter words, otherwise 1 point per letter
      const pointsEarned = currentWord.length === 4 ? 1 : currentWord.length;
      setScore(score + pointsEarned);
      
      setMessage(`Отлично! +${pointsEarned} очков`);
      
      // Check if all possible words have been found
      if (foundWords.length + 1 === possibleWords.length && possibleWords.length > 0) {
        setMessage('Поздравляем! Вы нашли все возможные слова!');
      }
    } else {
      setMessage('Это не существующее слово или не существительное в единственном числе');
    }
    
    setCurrentWord('');
  };
  
  const resetWord = () => {
    setCurrentWord('');
  };
  
  // Hexagons in a honeycomb pattern - Center position is first in the array
  const hexPositions = [
    { top: 60, left: 120 }, // Center - always position 0
    { top: 0, left: 120 },  // Top
    { top: 30, left: 190 }, // Top Right
    { top: 90, left: 190 }, // Bottom Right
    { top: 120, left: 120 }, // Bottom
    { top: 90, left: 50 },  // Bottom Left
    { top: 30, left: 50 }   // Top Left
  ];

  // Show loading screen while dictionary loads
  if (!dictionaryLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Русские Соты</h1>
        <p className="mb-4 text-center">{message}</p>
        <div className="w-16 h-16 border-t-4 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Русские Соты</h1>
      
      <div className="mb-6 relative h-40 w-64">
        {gameLetters.map((letter, index) => {
          // Determine proper position index - letter at index 0 goes to position 0 (center)
          const positionIndex = index;
          return (
            <div 
              key={index}
              onClick={() => handleLetterClick(letter)}
              className={`absolute cursor-pointer flex items-center justify-center 
                         ${letter === centerLetter ? 'bg-yellow-300' : 'bg-gray-200'} 
                         w-16 h-16 text-2xl font-bold
                         transform rotate-45`}
              style={{
                top: `${hexPositions[positionIndex].top}px`,
                left: `${hexPositions[positionIndex].left}px`,
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
              }}
            >
              <span className="transform -rotate-45">{letter.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
      
      <div className="mb-4 flex items-center space-x-2">
        <div className="text-xl font-semibold p-2 min-h-10 bg-gray-100 rounded w-48 text-center">
          {currentWord.toUpperCase()}
        </div>
        <button 
          onClick={handleDelete} 
          className="px-3 py-2 bg-red-500 text-white rounded"
        >
          ⌫
        </button>
      </div>
      
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={resetWord} 
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Очистить
        </button>
        <button 
          onClick={handleSubmit} 
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Отправить
        </button>
      </div>
      
      <div className="mb-4 text-center">
        <p className="text-lg">{message}</p>
        <p className="text-xl font-bold">Счёт: {score}</p>
        <p className="text-sm">Найдено: {foundWords.length} / {possibleWords.length} возможных слов</p>
      </div>
      
      <div className="w-full">
        <h2 className="text-lg font-semibold mb-2">Найденные слова:</h2>
        <div className="flex flex-wrap gap-2">
          {foundWords.map((word, index) => (
            <span key={index} className="bg-green-100 px-2 py-1 rounded">
              {word.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex space-x-2 mt-6">
        <button 
          onClick={startNewGame} 
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Новая игра
        </button>
      </div>
    </div>
  );
};

export default RussianWordGame;
