import React from 'react';

export default class Main extends React.Component {
  componentDidMount () {
    const ssMoveHeader = function () {
      let hero = $ ('.page-hero'),
        hdr = $ ('header'),
        triggerHeight = hero.outerHeight () - 170;

      $WIN.on ('scroll', () => {
        const loc = $WIN.scrollTop ();

        if (loc > triggerHeight) {
          hdr.addClass ('removeClasssticky');
        } else {
          hdr.removeClass ('sticky');
        }

        if (loc > triggerHeight + 20) {
          hdr.addClass ('offset');
        } else {
          hdr.removeClass ('offset');
        }

        if (loc > triggerHeight + 150) {
          hdr.addClass ('scrolling');
        } else {
          hdr.removeClass ('scrolling');
        }
      });
    };
  }
  render () {
    return (
      <section
        id="home"
        className="s-home page-hero target-section"
        data-parallax="scroll"
        data-image-src="images/shibi.jpg"
        data-natural-width="3000"
        data-natural-height="2000"
        data-position-y="center"
      >
        <div className="overlay" />
        <div className="shadow-overlay" />

        <div className="home-content">
          <div className="row home-content__main">
            <h3>Hello There</h3>

            <h1>
              I am ShiBa,<br />
              an artist <br />
              from Maldives.
            </h1>

            <div className="home-content__buttons">
              <a href="#works" className="smoothscroll btn btn--stroke">
                Latest Projects
              </a>
              <a
                href="https://www.instagram.com/shadoart_/"
                target="_blank"
                className="smoothscroll btn btn--stroke"
                style={{padding: '0px'}}
              >
                Visit my Instagram
              </a>
            </div>

            <div className="home-content__scroll">
              <a href="#about" className="scroll-link smoothscroll" />
            </div>
          </div>
        </div>

      </section>
    );
  }
}
