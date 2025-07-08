import { useEffect, useRef, useState } from 'react';

export default function Game() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [symbol, setSymbol] = useState('');
  const [turn, setTurn] = useState('X');
  const [status, setStatus] = useState('Connecting...');
  const [history, setHistory] = useState([]);

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/tttService');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'assign') {
        setSymbol(data.symbol);
      }

      if (data.type === 'update') {
        setSquares(data.board);
        setTurn(data.turn);
  
        if (data.history) {
          setHistory(data.history);
        }
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const winner = calculateWinner(squares);
    if (winner) {
      setStatus(`Ganador: ${winner}`);
    } else if (squares.every(cell => cell !== null)) {
      setStatus("Empate");
    } else if (symbol === '') {
      setStatus("Espectador...");
    } else if (symbol !== turn) {
      setStatus("Esperando al oponente...");
    } else {
      setStatus("Tu turno");
    }
  }, [squares, turn, symbol]);

  const handleClick = (i) => {
    if (!symbol || symbol !== turn) return;
    if (squares[i] || calculateWinner(squares)) return;

    socketRef.current.send(
      JSON.stringify({ type: 'move', index: i, player: symbol })
    );
  };

  const handleReset = () => {
    socketRef.current.send(JSON.stringify({ type: 'reset' }));
  };

  

  const handleJumpTo = (index) => {
    socketRef.current.send(JSON.stringify({ type: 'jumpTo', index }));
  };

  const renderBoard = (boardData) => (
    <>
      <div className="board-row">
        <Square value={boardData[0]} onSquareClick={() => handleClick(0)} />
        <Square value={boardData[1]} onSquareClick={() => handleClick(1)} />
        <Square value={boardData[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={boardData[3]} onSquareClick={() => handleClick(3)} />
        <Square value={boardData[4]} onSquareClick={() => handleClick(4)} />
        <Square value={boardData[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={boardData[6]} onSquareClick={() => handleClick(6)} />
        <Square value={boardData[7]} onSquareClick={() => handleClick(7)} />
        <Square value={boardData[8]} onSquareClick={() => handleClick(8)} />
      </div>
    </>
  );

  return (
    <div className="game">
      <div className="game-board">
        <div className="status">
          <strong>You are: {symbol || '...'}</strong> | {status}
        </div>
        {renderBoard(squares)}
      </div>

      <div className="game-controls" style={{ marginTop: '1rem' }}>
       
        <button onClick={handleReset} style={{ marginLeft: '1rem' }}>
          Reset
        </button>
      </div>

      <div className="history-list" style={{ marginTop: '2rem' }}>
        <strong>Historial:</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          {history.map((h, idx) => (
            <button key={idx} onClick={() => handleJumpTo(idx)}>
              Ir a movimiento #{idx}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
