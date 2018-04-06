import React from 'react';
import Link from 'gatsby-link';
import styled from 'styled-components';

export default class Header extends React.Component {
  componentDidMount () {
    const ssMobileMenu = function () {
      let toggleButton = $ ('.header-menu-toggle'),
        nav = $ ('.header-nav-wrap');

      toggleButton.on ('click', event => {
        event.preventDefault ();

        toggleButton.toggleClass ('is-clicked');
        nav.slideToggle ();
      });

      if (toggleButton.is (':visible')) nav.addClass ('mobile');

      $WIN.on ('resize', () => {
        if (toggleButton.is (':visible')) nav.addClass ('mobile');
        else nav.removeClass ('mobile');
      });

      nav.find ('a').on ('click', () => {
        if (nav.hasClass ('mobile')) {
          toggleButton.toggleClass ('is-clicked');
          nav.slideToggle ();
        }
      });
    };
  }

  render () {
    const Parallax = styled.div`
       {
        visibility: visible;
        z-index: -100;
        position: fixed;
        top: 0px;
        left: 0px;
        overflow: hidden;
        transform: translate3d(0px, 0px, 0px);
        height: 786px;
        width: 1284px;
      }
    `;

    const Image = styled.img`
       {
        transform: translate3d(0px, 0px, 0px);
        position: absolute;
        top: -199px;
        left: 0px;
        height: 856px;
        width: 1284px;
        max-width: none;
      }
    `;

    const Pace = styled.div`
       {
        transform: translate3d(100%, 0px, 0px);
      }
    `;
    return (
      <div>
        <Parallax className="parallax-mirror">
          <Image className="parallax-slider" />
        </Parallax>

        <div className="pace  pace-inactive">
          <Pace
            className="pace-progress"
            data-progress-text="100%"
            data-progress="99"
          >
            <div className="pace-progress-inner" />
          </Pace>
          <div className="pace-activity" />
        </div>
        <header className="s-header">
          <div className="header-logo">
            <a className="site-logo" href="index.html">
              <img src="images/logo.png" alt="Homepage" />
            </a>
          </div>

          <nav className="header-nav-wrap">
            <ul className="header-nav">
              <li className="current">
                <a href="#" className="smoothscroll" title="home">
                  Home
                </a>
              </li>
              <li>
                <a href="#anchor1" className="smoothscroll" title="about">
                  About
                </a>
              </li>
              <li>
                <a href="#anchor2" className="smoothscroll" title="works">
                  Works
                </a>
              </li>
              <li>

                <a href="#anchor3" className="smoothscroll" title="contact">
                  Contact
                </a>

              </li>
            </ul>
          </nav>

          {/* <Link to="#">
            <a className="header-menu-toggle" href="#0">
              <span>Menu</span>
            </a>
          </Link> */}
        </header>
      </div>
    );
  }
}
