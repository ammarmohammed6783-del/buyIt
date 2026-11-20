import Footer from "../components/Footer"
import Offer from "../components/Offer"
import Hero from "../components/Hero"
// import Footer from "../components/Footer"
// import Footer from "../components/Footer"

export default function page() {
    return (
        <div>
            <section id="home">
                <Hero />
            </section>
            <section id="features">
                {/* <Features /> */}
            </section>
            <section id="categories">
                {/* <Categories /> */}
            </section>
            <section id="shop">
                <Offer />
            </section>
            <section id="contact">
                <Footer />
            </section>
        </div>
    )
}
