import React from 'react';
import styled from 'styled-components';

const Masonry = styled.div`
  @media screen and (min-width: 900px) {
    position: relative;
    height: 1084px;
  }
`;

const Masonry1 = styled.div`
  @media screen and (min-width: 900px) {
    position: absolute;
    left: 0px;
    top: 0px;
  }
`;

const Masonry2 = styled.div`
  @media screen and (min-width: 900px) {
    position: absolute;
    left: 333px;
    top: 0px;
  }
`;

const Masonry3 = styled.div`
  @media screen and (min-width: 900px) {
    position: absolute;
    left: 666px;
    top: 0px;
  }
`;

const Masonry4 = styled.div`
  @media screen and (min-width: 900px) {
    position: absolute;
    left: 0px;
    top: 334px;
  }
`;

const Masonry5 = styled.div`
  @media screen and (min-width: 900px) {
    position: absolute;
    left: 666px;
    top: 334px;
  }
`;

const Masonry6 = styled.div`
  @media (min-width: 900px) {
    position: absolute;
    left: 333px;
    top: 416px;
  }
`;

const Masonry7 = styled.div`
  @media screen and (min-width: 900px) {
    position: absolute;
    left: 0px;
    top: 750px;
  }
`;

const Masonry8 = styled.div`
  @media screen and (min-width: 900px) {
    position: absolute;
    left: 666px;
    top: 750px;
  }
`;

export default () => (
  <section id="works" className="s-works target-section" id="anchor2">
    <div className="row narrow section-intro has-bottom-sep">
      <div className="col-full">
        <h3>Portfolio</h3>
        <h1>See My Latest Projects.</h1>

        <p className="lead">
          Lorem ipsum Dolor adipisicing nostrud et aute Excepteur amet commodo
          ea dolore irure esse Duis nulla sint fugiat cillum ullamco proident
          aliquip quis qui voluptate dolore veniam Ut laborum non est in
          officia.
        </p>
      </div>
    </div>

    <div className="row masonry-wrap">
      <Masonry className="masonry">
        <Masonry1 className="masonry__brick">
          <div className="item-folio">
            <div className="item-folio__thumb">
              <a
                href="images/portfolio/gallery/g-beetle.jpg"
                className="thumb-link"
                title="The Beetle Car"
                data-size="1050x700"
              >
                <img
                  src="images/portfolio/beetle.jpg"
                  srcSet="images/portfolio/beetle.jpg 1x, images/portfolio/beetle@2x.jpg 2x"
                  alt=""
                />
                <span className="shadow-overlay" />
              </a>
            </div>

            <div className="item-folio__text">
              <h3 className="item-folio__title">The Beetle</h3>
              <p className="item-folio__cat">Web Development</p>
            </div>

            <a
              href="https://www.behance.net/"
              className="item-folio__project-link"
              title="Project link"
            >
              <i className="im im-link" />
            </a>

            <div className="item-folio__caption">
              <p>
                Vero molestiae sed aut natus excepturi. Et tempora numquam.
                Temporibus iusto quo.Unde dolorem corrupti neque nisi.
              </p>
            </div>
          </div>
        </Masonry1>

        <Masonry2 className="masonry__brick">
          <div className="item-folio">
            <div className="item-folio__thumb">
              <a
                href="images/portfolio/gallery/g-lighthouse.jpg"
                className="thumb-link"
                title="Lighthouse"
                data-size="1050x700"
              >
                <img
                  src="images/portfolio/lighthouse.jpg"
                  srcSet="images/portfolio/lighthouse.jpg 1x, images/portfolio/lighthouse@2x.jpg 2x"
                  alt=""
                />
                <span className="shadow-overlay" />
              </a>
            </div>

            <div className="item-folio__text">
              <h3 className="item-folio__title">Lighthouse</h3>
              <p className="item-folio__cat">Web Design</p>
            </div>

            <a
              href="https://www.behance.net/"
              className="item-folio__project-link"
              title="Project link"
            >
              <i className="im im-link" />
            </a>

            <div className="item-folio__caption">
              <p>
                Vero molestiae sed aut natus excepturi. Et tempora numquam.
                Temporibus iusto quo.Unde dolorem corrupti neque nisi.
              </p>
            </div>
          </div>
        </Masonry2>

        <Masonry3 className="masonry__brick">
          <div className="item-folio">
            <div className="item-folio__thumb">
              <a
                href="images/portfolio/gallery/g-salad.jpg"
                className="thumb-link"
                data-size="1050x700"
              >
                <img
                  src="images/portfolio/salad.jpg"
                  srcSet="images/portfolio/salad.jpg 1x, images/portfolio/salad@2x.jpg 2x"
                  alt=""
                />
                <span className="shadow-overlay" />
              </a>
            </div>

            <div className="item-folio__text">
              <h3 className="item-folio__title">Salad</h3>
              <p className="item-folio__cat">Branding</p>
            </div>

            <a
              href="https://www.behance.net/"
              className="item-folio__project-link"
              title="Project link"
            >
              <i className="im im-link" />
            </a>

            <span className="item-folio__caption">
              <p>
                Vero molestiae sed aut natus excepturi. Et tempora numquam.
                Temporibus iusto quo.Unde dolorem corrupti neque nisi.
              </p>
            </span>
          </div>
        </Masonry3>

        <Masonry4 className="masonry__brick">
          <div className="item-folio">
            <div className="item-folio__thumb">
              <a
                href="images/portfolio/gallery/g-woodcraft.jpg"
                className="thumb-link"
                data-size="1050x700"
              >
                <img
                  src="images/portfolio/woodcraft.jpg"
                  srcSet="images/portfolio/woodcraft.jpg 1x, images/portfolio/woodcraft@2x.jpg 2x"
                  alt=""
                />
                <span className="shadow-overlay" />
              </a>
            </div>

            <div className="item-folio__text">
              <h3 className="item-folio__title">Woodcraft</h3>
              <p className="item-folio__cat">Branding</p>
            </div>

            <a
              href="https://www.behance.net/"
              className="item-folio__project-link"
              title="Project link"
            >
              <i className="im im-link" />
            </a>

            <span className="item-folio__caption">
              <p>
                Vero molestiae sed aut natus excepturi. Et tempora numquam.
                Temporibus iusto quo.Unde dolorem corrupti neque nisi.
              </p>
            </span>
          </div>
        </Masonry4>

        <Masonry5 className="masonry__brick">
          <div className="item-folio">
            <div className="item-folio__thumb">
              <a
                href="images/portfolio/gallery/g-skaterboy.jpg"
                className="thumb-link"
                data-size="1050x700"
              >
                <img
                  src="images/portfolio/skaterboy.jpg"
                  srcSet="images/portfolio/skaterboy.jpg 1x, images/portfolio/skaterboy@2x.jpg 2x"
                  alt=""
                />
                <span className="shadow-overlay" />
              </a>
            </div>

            <div className="item-folio__text">
              <h3 className="item-folio__title">Skaterboy</h3>
              <p className="item-folio__cat">Web Development</p>
            </div>

            <a
              href="https://www.behance.net/"
              className="item-folio__project-link"
              title="Project link"
            >
              <i className="im im-link" />
            </a>

            <span className="item-folio__caption">
              <p>
                Vero molestiae sed aut natus excepturi. Et tempora numquam.
                Temporibus iusto quo.Unde dolorem corrupti neque nisi.
              </p>
            </span>
          </div>
        </Masonry5>

        <Masonry6 className="masonry__brick">
          <div className="item-folio">
            <div className="item-folio__thumb">
              <a
                href="images/portfolio/gallery/g-liberty.jpg"
                className="thumb-link"
                data-size="1050x700"
              >
                <img
                  src="images/portfolio/liberty.jpg"
                  srcSet="images/portfolio/liberty.jpg 1x, images/portfolio/liberty@2x.jpg 2x"
                  alt=""
                />
                <span className="shadow-overlay" />
              </a>
            </div>

            <div className="item-folio__text">
              <h3 className="item-folio__title">Liberty</h3>
              <p className="item-folio__cat">Branding</p>
            </div>

            <a
              href="https://www.behance.net/"
              className="item-folio__project-link"
              title="Project link"
            >
              <i className="im im-link" />
            </a>

            <span className="item-folio__caption">
              <p>
                Vero molestiae sed aut natus excepturi. Et tempora numquam.
                Temporibus iusto quo.Unde dolorem corrupti neque nisi.
              </p>
            </span>
          </div>
        </Masonry6>

        <Masonry7 className="masonry__brick">
          <div className="item-folio">
            <div className="item-folio__thumb">
              <a
                href="images/portfolio/gallery/g-minimalismo.jpg"
                className="thumb-link"
                data-size="1050x700"
              >
                <img
                  src="images/portfolio/minimalismo.jpg"
                  srcSet="images/portfolio/minimalismo.jpg 1x, images/portfolio/minimalismo@2x.jpg 2x"
                  alt=""
                />
                <span className="shadow-overlay" />
              </a>
            </div>

            <div className="item-folio__text">
              <h3 className="item-folio__title">Minimalismo</h3>
              <p className="item-folio__cat">Web Design</p>
            </div>

            <a
              href="https://www.behance.net/"
              className="item-folio__project-link"
              title="Project link"
            >
              <i className="im im-link" />
            </a>

            <span className="item-folio__caption">
              <p>
                Vero molestiae sed aut natus excepturi. Et tempora numquam.
                Temporibus iusto quo.Unde dolorem corrupti neque nisi.
              </p>
            </span>
          </div>
        </Masonry7>

        <Masonry8 className="masonry__brick">
          <div className="item-folio">
            <div className="item-folio__thumb">
              <a
                href="images/portfolio/gallery/g-shutterbug.jpg"
                className="thumb-link"
                data-size="1050x700"
              >
                <img
                  src="images/portfolio/shutterbug.jpg"
                  srcSet="images/portfolio/shutterbug.jpg 1x, images/portfolio/shutterbug@2x.jpg 2x"
                  alt=""
                />
                <span className="shadow-overlay" />
              </a>
            </div>

            <div className="item-folio__text">
              <h3 className="item-folio__title">Lady Shutterbug</h3>
              <p className="item-folio__cat">Branding</p>
            </div>

            <a
              href="https://www.behance.net/"
              className="item-folio__project-link"
              title="Project link"
            >
              <i className="im im-link" />
            </a>

            <span className="item-folio__caption">
              <p>
                Vero molestiae sed aut natus excepturi. Et tempora numquam.
                Temporibus iusto quo.Unde dolorem corrupti neque nisi.
              </p>
            </span>
          </div>
        </Masonry8>
      </Masonry>
    </div>
  </section>
);
