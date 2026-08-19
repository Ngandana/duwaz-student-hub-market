
import React from 'react';

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8">About Duwaz.</h1>
      
      {/* Mission */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
        <p className="text-lg text-gray-700 mb-4">
          Duwaz is a student-to-student marketplace built to empower student entrepreneurs and make everyday essentials more accessible to the campus community.
        </p>
        <p className="text-lg text-gray-700">
          Our platform connects student businesses with their peers, creating a vibrant economic ecosystem within South African universities that benefits both buyers and sellers.
        </p>
      </section>
      
      {/* Vision Cards */}
      <section className="mb-12 grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-duwaz-brown">
          <h3 className="text-xl font-bold mb-3">Supporting Student Entrepreneurs</h3>
          <p className="text-gray-700">
            We provide an accessible platform for students to launch and grow their businesses while studying, helping them gain real-world experience and generate income.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-duwaz-brown">
          <h3 className="text-xl font-bold mb-3">Campus Convenience</h3>
          <p className="text-gray-700">
            Access affordable everyday essentials without leaving campus, from snacks and bread to socks and supplies, all provided by fellow students.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-duwaz-brown">
          <h3 className="text-xl font-bold mb-3">Community Building</h3>
          <p className="text-gray-700">
            We're fostering a community where students support each other, creating relationships that extend beyond transactions into meaningful connections.
          </p>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">How Duwaz Works</h2>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-3">For Shoppers</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Browse products from student-run shops across different categories</li>
                <li>Purchase everyday essentials without leaving campus</li>
                <li>Earn points with every purchase that can be redeemed for discounts</li>
                <li>Support fellow students and their entrepreneurial journeys</li>
              </ul>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-3">For Student Businesses</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Create your shop profile quickly and easily</li>
                <li>List and sell your products to the student community</li>
                <li>Build a customer base and grow your business</li>
                <li>Gain valuable entrepreneurial experience while studying</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Points System */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Points Reward System</h2>
        <p className="text-lg text-gray-700 mb-4">
          Our points system rewards active members of the Duwaz community:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-bold mb-2">Earn Points By:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Making purchases on the platform</li>
              <li>Completing surveys and providing feedback</li>
              <li>Referring friends to join Duwaz</li>
              <li>Participating in campus events</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-bold mb-2">Redeem Points For:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Discounts on future purchases</li>
              <li>Exclusive access to special products</li>
              <li>Priority access to campus events</li>
              <li>Participation in monthly giveaways</li>
            </ul>
          </div>
        </div>
      </section>
      
      {/* Join Us */}
      <section className="text-center bg-duwaz-brown text-white p-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-4">Join the Duwaz Community Today</h2>
        <p className="text-lg mb-8">
          Whether you're looking to shop or start your own student business, Duwaz has something for you.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <a href="/marketplace" className="bg-white text-duwaz-brown px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
            Start Shopping
          </a>
          <a href="/create-shop" className="bg-duwaz-black text-white px-6 py-3 rounded-md font-medium hover:bg-black/80 transition-colors">
            Create Your Shop
          </a>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
