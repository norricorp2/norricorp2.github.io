var ghpages = require('gh-pages');

ghpages.publish(
	'public', // path to public directory
	{
		branch: 'gh-pages',
		repo: 'https://github.com/norricorp2/norricorp2.github.io.git', // Update to point to your repository
		user: {
			name: 'Johnny', // update to use your name
			email: 'john@norricorp.com' // Update to use your email
		},
		dotfiles: true
	},
	() => {
		console.log('Deploy Complete!');
	}
);