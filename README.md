# CSV Upload Validate Save

Phases:

- Check the extension (only csv supported right now)
- Check the header
- Initial scan... Check the number of rows and columns
- Custom validation on per row basis
- If abort, display errors
- Full scan... Attempt save - succeed or fail
- Abort if too many failures
- Display errors

To do:

- [ ] Initial scan
- [ ] Track counts and display
- [ ] Display errors better
- [ ] Success screen
