import React, { useState, useEffect, useCallback } from 'react';
import './MoviePreview.css';

const MoviePreview = ({ movie, isActive, onBack }) => {
  const [focusedElement, setFocusedElement] = useState('play');
  const [isFavorite, setIsFavorite] = useState(false);
  const [focusArea, setFocusArea] = useState('actions');

  // Detectar ambiente Tizen TV
  const isTizenTV = typeof tizen !== 'undefined' || window.navigator.userAgent.includes('Tizen');
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Credenciais da API
  const API_CREDENTIALS = 'username=zBB82J&password=AMeDHq';

  const toggleFavorite = useCallback(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
    const movieKey = `movie_${movie.stream_id}`;
    
    if (favorites[movieKey]) {
      delete favorites[movieKey];
      setIsFavorite(false);
    } else {
      favorites[movieKey] = {
        ...movie,
        type: 'movie',
        addedAt: new Date().toISOString()
      };
      setIsFavorite(true);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [movie]);

  const handleAction = useCallback((action) => {
    console.log('🎬 MoviePreview - handleAction chamado com:', action);
    console.log('🎬 MoviePreview - Filme atual:', movie);
    console.log('🎬 MoviePreview - Ambiente:', { isTizenTV, isDevelopment });
    
    switch (action) {
      case 'play':
        // Construir URL do stream com a estrutura correta (mesma dos canais que funcionam)
        const streamUrl = `https://rota66.bar/movie/${API_CREDENTIALS.split('&')[0].split('=')[1]}/${API_CREDENTIALS.split('&')[1].split('=')[1]}/${movie.stream_id}.mp4`;
        
        // Informações do filme para o player
        const streamInfo = {
          name: movie.name,
          category: movie.category_name || 'Filme',
          description: movie.plot || `Filme - ${movie.name}`,
          year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null,
          rating: movie.rating,
          type: 'movie'
        };

        // Para Tizen TV, usar configuração específica que força player interno
        if (isTizenTV) {
          console.log('📺 MoviePreview - Configuração Tizen TV ativada');
          
          // Evento personalizado com configurações específicas para TV
          const playEvent = new CustomEvent('playContent', {
            detail: {
              streamUrl,
              streamInfo: {
                ...streamInfo,
                // Flags específicas para Tizen TV
                forceTizenPlayer: true,
                preventBrowserRedirect: true,
                useInternalPlayer: true
              }
            },
            bubbles: false, // Não permitir propagação que pode causar redirect
            cancelable: false // Não permitir cancelamento por outros handlers
          });
          
          // Prevenir qualquer comportamento padrão que possa causar redirect
          setTimeout(() => {
            console.log('📺 MoviePreview - Disparando evento playContent para Tizen TV');
            window.dispatchEvent(playEvent);
          }, 100); // Pequeno delay para garantir que o evento seja tratado corretamente
          
        } else {
          // Para outros ambientes, usar o comportamento padrão
          console.log('💻 MoviePreview - Configuração padrão ativada');
          
          // Disparar evento para reproduzir no VideoPlayer
          const playEvent = new CustomEvent('playContent', {
            detail: { streamUrl, streamInfo }
          });
          window.dispatchEvent(playEvent);
        }
        break;
      
      case 'favorite':
        toggleFavorite();
        break;
      
      default:
        break;
    }
  }, [movie, isTizenTV, isDevelopment, toggleFavorite]);

  // Navegação das ações (botões Play/Favoritos)
  const handleActionsNavigation = useCallback((keyCode) => {
    if (keyCode === 37) { // Esquerda
      setFocusedElement(focusedElement === 'play' ? 'favorite' : 'play');
    } else if (keyCode === 39) { // Direita
      setFocusedElement(focusedElement === 'play' ? 'favorite' : 'play');
    } else if (keyCode === 13) { // Enter - executar ação
      handleAction(focusedElement);
    }
  }, [focusedElement, handleAction]);

  // Inicialização
  useEffect(() => {
    if (!isActive || !movie) return;

    // Reset do estado quando a página fica ativa
    setFocusedElement('play');
    setFocusArea('actions');
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
    const movieKey = `movie_${movie.stream_id}`;
    setIsFavorite(!!favorites[movieKey]);
  }, [isActive, movie]);

  // Sistema de navegação por controle remoto
  useEffect(() => {
    if (!isActive) return;

    const handleMovieDetailsNavigation = (event) => {
      const { keyCode } = event.detail;
      
      // Tratar tecla de voltar
      if (keyCode === 8 || keyCode === 10009) { // Backspace ou Return
        onBack();
        return;
      }
      
      // Delegar navegação baseada na área de foco
      if (focusArea === 'actions') {
        handleActionsNavigation(keyCode);
      }
    };

    window.addEventListener('movieDetailsNavigation', handleMovieDetailsNavigation);
    return () => window.removeEventListener('movieDetailsNavigation', handleMovieDetailsNavigation);
  }, [
    isActive,
    focusArea,
    handleActionsNavigation,
    onBack
  ]);

  if (!isActive || !movie) return null;

  return (
    <div className="movie-details-page">
      <div className="movie-main-layout">
        <div className="movie-info-panel">
          <div className="movie-header-info">
            <img 
              src="/images/logo-provider.png" 
              alt="Provider Logo" 
              className="movie-provider-logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            
            <div className="new-movie-badge">
              Filme em Destaque
            </div>
            
            <h1 className="movie-title-main">{movie.name}</h1>
            
            <div className="movie-meta-info">
              <div className="meta-item age-rating">
                <i className="fas fa-shield-alt"></i>
                <span>14+</span>
              </div>
              <div className="meta-item movie-year">
                <i className="fas fa-calendar-alt"></i>
                <span>{movie.releasedate || 'N/A'}</span>
              </div>
              <div className="meta-item movie-rating">
                <i className="fas fa-star"></i>
                <span>⭐ {movie.rating || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="movie-synopsis">
            <p className="synopsis-text expanded">
              {movie.plot || 'Descrição não disponível para este filme.'}
            </p>
          </div>
          
          <div className="movie-genres">
            <div className="genre-tag">{movie.category_name || 'Filme'}</div>
            <div className="genre-tag">HD</div>
            <div className="genre-tag">Legendado</div>
          </div>
          
          <div className="movie-action-buttons">
            <button 
              className={`primary-action-btn ${focusArea === 'actions' && focusedElement === 'play' ? 'focused' : ''}`}
              onClick={() => handleAction('play')}
            >
              <i className="fas fa-play"></i>
              Assistir Filme
            </button>
            
            <button 
              className={`secondary-action-btn ${focusArea === 'actions' && focusedElement === 'favorite' ? 'focused' : ''}`}
              onClick={() => handleAction('favorite')}
            >
              <i className={`fas ${isFavorite ? 'fa-heart' : 'fa-plus'}`}></i>
              {isFavorite ? 'Na Minha Lista' : 'Minha Lista'}
            </button>
          </div>
        </div>
        
        <div className="movie-promotional-art">
          <img 
            src={movie.stream_icon || '/images/placeholder-movie.jpg'} 
            alt={movie.name}
            className="promotional-image"
            loading="lazy"
            onError={(e) => {
              e.target.src = '/images/placeholder-movie.jpg';
            }}
          />
          <div className="promotional-overlay"></div>
        </div>
      </div>

      <div className="movie-info-area">
        <div className="movie-additional-info">
          <div className="info-section">
            <h3>Informações do Filme</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Ano:</span>
                <span className="info-value">{movie.releasedate || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Categoria:</span>
                <span className="info-value">{movie.category_name || 'Filme'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Avaliação:</span>
                <span className="info-value">⭐ {movie.rating || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Qualidade:</span>
                <span className="info-value">HD 1080p</span>
              </div>
            </div>
          </div>
          
          <div className="movie-controls-hint">
            <div className="control-item">
              <i className="fas fa-arrow-left"></i>
              <i className="fas fa-arrow-right"></i>
              <span>Navegar</span>
            </div>
            <div className="control-item">
              <span>ENTER</span>
              <span>Selecionar</span>
            </div>
            <div className="control-item">
              <span>VOLTAR</span>
              <span>Retornar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoviePreview; 