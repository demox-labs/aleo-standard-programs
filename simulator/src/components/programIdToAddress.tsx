import { programToAddress } from '../utils/aleoWasmFunctions';
import React, { useState, useEffect } from 'react';

function StringTransformationComponent() {
  const [transformedStrings, setTransformedStrings] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: any) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    const inputList = inputValue.split(',');
    async function transformStrings() {
      const transformedResults: string[] = [];

      for (let input of inputList) {
        input = input.trim();
        if (input.indexOf(".aleo") > 0) {
          const transformed = await programToAddress(input);
          transformedResults.push(transformed);
        }
      }

      setTransformedStrings(transformedResults);
    }

    transformStrings();
  }, [inputValue]);

  return (
    <div>
      <input
        type="text"
        placeholder="credits.aleo, program.aleo"
        value={inputValue}
        onChange={handleInputChange}
      />
      <h2>Program Addresses</h2>
      <ul>
        {transformedStrings.map((str, index) => (
          <li key={index}>{str}</li>
        ))}
      </ul>
    </div>
  );
}

export default StringTransformationComponent;
