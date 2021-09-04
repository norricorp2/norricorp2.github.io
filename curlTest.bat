curl -k -X POST -H "Content-Type: application/json" -d "{\"email\":\"johnny@email.com\", \"password\":\"12345678\"}" https://mint20-loopback4:3000/users/login



curl -k -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgzYzczMjBlLTM0MTYtNGZlNS05NGQ1LTFhNzMyOTcwMjNlNyIsImVtYWlsIjoiam9obm55QGVtYWlsLmNvbSIsImlhdCI6MTYzMDMwOTIwMSwiZXhwIjoxNjMwMzMwODAxfQ.LpiFsiEAbZA0-dGdn8R09YQqkTKSbaGIBgeEvyIVqOk" https://mint20-loopback4:3000/todos


curl -k -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgzYzczMjBlLTM0MTYtNGZlNS05NGQ1LTFhNzMyOTcwMjNlNyIsImVtYWlsIjoiam9obm55QGVtYWlsLmNvbSIsImlhdCI6MTYzMDMwOTIwMSwiZXhwIjoxNjMwMzMwODAxfQ.LpiFsiEAbZA0-dGdn8R09YQqkTKSbaGIBgeEvyIVqOk" https://mint20-loopback4:3000/todo-lists


curl -k -X POST -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgzYzczMjBlLTM0MTYtNGZlNS05NGQ1LTFhNzMyOTcwMjNlNyIsImVtYWlsIjoiam9obm55QGVtYWlsLmNvbSIsImlhdCI6MTYzMDMwOTIwMSwiZXhwIjoxNjMwMzMwODAxfQ.LpiFsiEAbZA0-dGdn8R09YQqkTKSbaGIBgeEvyIVqOk" -d "{\"title\":\"continue tar on shed\", \"isComplete\":false}" https://mint20-loopback4:3000/todo-lists/101/todos


curl -k -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgzYzczMjBlLTM0MTYtNGZlNS05NGQ1LTFhNzMyOTcwMjNlNyIsImVtYWlsIjoiam9obm55QGVtYWlsLmNvbSIsImlhdCI6MTYzMDMwOTIwMSwiZXhwIjoxNjMwMzMwODAxfQ.LpiFsiEAbZA0-dGdn8R09YQqkTKSbaGIBgeEvyIVqOk" https://mint20-loopback4:3000/todo-lists/101/todos


curl -k -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIzY2JmZWYwLWVlZjUtNDg3Mi05ODA1LWY4ZDUxNTI5ZDY1NSIsImVtYWlsIjoibWFyaWFAZW1haWwuY29tIiwiaWF0IjoxNjMwMzA5NzY0LCJleHAiOjE2MzAzMzEzNjR9.G49xIbIjRjyiRW5cNF5oB_gdZmGBfjhpF6NXK5OGMwE" https://mint20-loopback4:3000/user/23cbfef0-eef5-4872-9805-f8d51529d655/todos



curl -k -X POST -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgzYzczMjBlLTM0MTYtNGZlNS05NGQ1LTFhNzMyOTcwMjNlNyIsImVtYWlsIjoiam9obm55QGVtYWlsLmNvbSIsImlhdCI6MTYzMDMwOTIwMSwiZXhwIjoxNjMwMzMwODAxfQ.LpiFsiEAbZA0-dGdn8R09YQqkTKSbaGIBgeEvyIVqOk" -d "{\"title\":\"repaint stairwell\", \"isComplete\":false}" https://mint20-loopback4:3000/user/83c7320e-3416-4fe5-94d5-1a73297023e7/todos



curl -k -X POST -H "Content-Type: application/json" -d "{\"email\":\"johnny@email.com\", \"password\":\"12345678\", \"roles\":[\"developer\", \"admin\"]}" https://mint20-loopback4:3000/signup

curl -k -X DELETE -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgzYzczMjBlLTM0MTYtNGZlNS05NGQ1LTFhNzMyOTcwMjNlNyIsImVtYWlsIjoiam9obm55QGVtYWlsLmNvbSIsImlhdCI6MTYzMDMwOTIwMSwiZXhwIjoxNjMwMzMwODAxfQ.LpiFsiEAbZA0-dGdn8R09YQqkTKSbaGIBgeEvyIVqOk" https://mint20-loopback4:3000/todos/114

