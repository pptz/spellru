import React, { useState, useEffect } from 'react';

const RussianWordGame = () => {
  // Sample Russian letters
  const allLetters = 'абвгдежзийклмнопрстуфхцчшщъыьэюя'.split('');
  
  const [gameLetters, setGameLetters] = useState([]);
  const [centerLetter, setCenterLetter] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [foundWords, setFoundWords] = useState([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Загрузка словаря...');
  const [possibleWords, setPossibleWords] = useState([]);
  const [dictionary, setDictionary] = useState([]);
  const [dictionaryLoaded, setDictionaryLoaded] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showCompleteUnfoundWords, setShowCompleteUnfoundWords] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Load dictionary
  useEffect(() => {
    console.log('Attempting to fetch dictionary from:', window.location.origin + 'dictionary.txt');

    //fetch('dictionary.txt')
    fetch(process.env.PUBLIC_URL + '/dictionary.txt')
      .then(response => {
        // Check for HTTP errors first
        if (!response.ok) {
          // Don't try to parse the response as text if it's an error
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        // Check content type to ensure we're getting a text file
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/plain')) {
          throw new Error(`Expected text/plain but got ${contentType}`);
        }
        
        return response.text();
      })
      .then(data => {
        // Add a sanity check on the data
        if (data.includes('<html') || data.includes('<!DOCTYPE')) {
          throw new Error('Received HTML instead of dictionary data');
        }
        
        const words = data.split(/\r?\n/).filter(word => word.trim().length > 0);
        setDictionary(words);
        setDictionaryLoaded(true);
        setMessage(`Словарь загружен: ${words.length} слов`);
      })
      .catch(error => {
        console.error('Error loading dictionary:', error);
        setMessage('Ошибка при загрузке словаря: ' + error.message);
        // Ensure dictionary is empty on error
        setDictionary([]);
        setDictionaryLoaded(false);
      });
  }, []);

  // Initialize the game
  useEffect(() => {
    if (dictionaryLoaded) {
      startNewGame();
    }
  }, [dictionaryLoaded]);

  // Add this useEffect for keyboard handling
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Handle letters
      const key = event.key.toLowerCase();
      
      // Check if the pressed key is one of our game letters
      if (gameLetters.includes(key)) {
        handleLetterClick(key);
      } 
      // Handle backspace/delete for removing the last letter
      else if (event.key === 'Backspace' || event.key === 'Delete') {
        handleDelete();
      } 
      // Handle Enter for submitting the word
      else if (event.key === 'Enter') {
        handleSubmit();
      }
      // Handle Escape to clear the current word
      else if (event.key === 'Escape') {
        resetWord();
      }
    };
  
    // Add the event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameLetters, currentWord]); // Dependencies: gameLetters and currentWord

  // Add this useEffect to handle the celebration timer
  useEffect(() => {
    if (showCelebration) {
      // Auto-hide celebration after 5 seconds
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  const canFormValidWords = (letters) => {
    const centerLetter = letters[0];
    const validWords = findPossibleWords(letters, centerLetter);
  
    // Check if there's at least one pangram (word using all 7 letters)
    //const hasPangram = validWords.some(word => {
    //  const uniqueLetters = new Set(word.split(''));
    //  return letters.every(l => uniqueLetters.has(l));
    //});

    //if (validWords.length >= 1 && hasPangram) {
    //if (validWords.length >= 10) {
    //  return { isValid: true, wordCount: validWords.length, words: validWords };
    //}

    // Check if each letter participates in at least one word
    const letterUsage = new Map(letters.map(letter => [letter, false]));
  
    validWords.forEach(word => {
      [...word].forEach(char => {
        if (letterUsage.has(char)) {
          letterUsage.set(char, true);
        }
      });
    });
    // Check if all letters are used
    const allLettersUsed = Array.from(letterUsage.values()).every(used => used);
    if (allLettersUsed) {
      return { isValid: true, wordCount: validWords.length, words: validWords };
    }
  
  return { isValid: false, wordCount: validWords.length };
};

  const generateViableLetterSet = () => {
    let attempts = 0;
    const maxAttempts = 1000; // Prevent infinite loops
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
    setShowHints(false); // hide hints
    setShowCompleteUnfoundWords(false); // hide spoilers

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
    setShowHints(false);
  };
  
  const findPossibleWords = (letters, centerLetter) => {
    const availableLetters = new Set(letters);
  
    return dictionary.filter(word => 
      word.length >= 4 &&
      word.includes(centerLetter) &&
      [...word].every(char => availableLetters.has(char))
    );
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
      setCurrentWord('');
      return;
    }
    
    if (!currentWord.includes(centerLetter)) {
      setMessage(`Слово должно содержать букву "${centerLetter}"`);
      setCurrentWord('');
      return;
    }
    
    if (foundWords.includes(currentWord)) {
      setMessage('Вы уже нашли это слово');
      setCurrentWord('');
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
        setShowCelebration(true); // Trigger celebration
      }
    } else {
      setMessage('Это не существующее слово или не существительное в единственном числе');
    }
    
    setCurrentWord('');
  };
  
  const resetWord = () => {
    setCurrentWord('');
  };

  const shuffleOuterLetters = () => {
    // Keep the center letter at index 0, shuffle the rest (positions 1-6)
    const newLetters = [...gameLetters];
    const outerLetters = newLetters.slice(1);
  
    // Fisher-Yates shuffle algorithm for the outer letters
    for (let i = outerLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [outerLetters[i], outerLetters[j]] = [outerLetters[j], outerLetters[i]];
    }
  
    // Combine the center letter with shuffled outer letters
    setGameLetters([newLetters[0], ...outerLetters]);
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
        <button
          onClick={shuffleOuterLetters}
          className="px-3 py-2 bg-gray-500 text-white rounded"
        >
          ♽
        </button>
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

      <div className="flex space-x-2 mt-4">
        <button
          onClick={() => setShowHints(!showHints)}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Подсказки
        </button>
      </div>

    {showHints && (
      <div className="w-full mt-4">
        <div className="flex flex-wrap gap-2">
          {possibleWords
            .filter(word => !foundWords.includes(word))
            .map((word, index) => (
              <span key={index} className="bg-red-100 px-2 py-1 rounded">
                {word.substring(0, 2).toUpperCase()}
              </span>
            ))}
        </div>
      </div>
    )}
    {showHints && (
      <>
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => setShowCompleteUnfoundWords(!showCompleteUnfoundWords)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {showCompleteUnfoundWords ? 'Скрыть слова' : 'Показать все слова'}
          </button>
        </div>
    
        {showCompleteUnfoundWords && (
          <div className="w-full mt-4">
            <h2 className="text-lg font-semibold mb-2">Все не найденные слова:</h2>
            <div className="flex flex-wrap gap-2">
              {possibleWords
                .filter(word => !foundWords.includes(word))
                .map((word, index) => (
                  <span key={index} className="bg-red-200 px-2 py-1 rounded">
                    {word.toUpperCase()}
                  </span>
                ))}
            </div>
          </div>
        )}
      </>
    )}
    {showCelebration && (
      <div className="fixed inset-0 pointer-events-none z-50">
        {Array.from({ length: 100 }).map((_, i) => {
          // Define all variables inside the map function
          const left = Math.random() * 100;
          const animationDuration = 3 + Math.random() * 2;
          const animationDelay = Math.random() * 2;
          const size = 5 + Math.random() * 10;

          // Random color
          const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          return (
            <div
              key={i}
              className={`absolute ${color} rounded-full opacity-70`}
              style={{
                left: `${left}%`,
                top: '-5%',
                width: `${size}px`,
                height: `${size}px`,
                animation: `fall ${animationDuration}s ease-in ${animationDelay}s forwards`
              }}
            />
          );
        })}
        
        <div 
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-center text-yellow-500 opacity-0"
          style={{
            animation: 'celebrationText 1.5s ease-out forwards',
            textShadow: '0 0 10px rgba(0,0,0,0.5)'
          }}
        >
          Поздравляем!
        </div>
      </div>
    )}
    </div>
  );
};

export default RussianWordGame;
