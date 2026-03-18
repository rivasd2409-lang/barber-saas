PROJECT: Barber SaaS



I am building a SaaS web application for barber shops.



Tech stack:

\- Next.js

\- Prisma

\- SQLite (initially, may move to PostgreSQL later)



The system supports multiple barbers working in parallel inside a barber shop.



Core models:



Shop

\- id

\- name

\- address



User

\- id

\- username

\- password

\- role (ADMIN, BARBER, STAFF)



Barber

\- id

\- name

\- avatar

\- stationNumber

\- manualStatus (AVAILABLE, OFF\_DUTY)

\- isActive

\- createdAt



Service

\- id

\- name

\- durationMinutes

\- price

\- isActive



Customer

\- id

\- name

\- phone

\- email (optional)

\- createdAt



Booking

\- id

\- customerId

\- barberId

\- serviceId

\- startAt

\- endAt

\- status

\- createdAt



Booking status values:

CONFIRMED

COMPLETED

CANCELLED

NO\_SHOW



Booking rules:

\- bookings start with status CONFIRMED

\- a barber can only handle one booking at a time

\- overlapping bookings for the same barber are not allowed



Scheduling system:

\- time slots use 15-minute blocks

\- services determine booking duration

\- bookings occupy multiple blocks depending on service duration



Barber status logic:

\- OFF\_DUTY → cannot be booked

\- WORKING → indicates current service but does NOT block future bookings

\- AVAILABLE → no current booking



Availability is determined by:

\- shop working hours

\- existing bookings

\- service duration

\- 15 minute intervals



Client booking flow:

1 user sees list of barbers

2 user selects a barber

3 user selects a service

4 system shows available time slots for that barber

5 booking is created



Barber cards display:

\- name

\- avatar

\- status



Shop staff workflow:

\- view daily agenda

\- see bookings ordered by time

\- empty slots show "+ Reserve"

\- staff can create walk-in bookings



Agenda rules:

\- agenda ordered chronologically

\- multiple barbers can have bookings at the same time

\- empty slots allow quick booking creation



Permissions:

\- barbers mark bookings as COMPLETED

\- staff or barber mark NO\_SHOW

\- customer, staff, or barber can CANCEL bookings



Current development step:

Implement Barber model and connect Booking to Barber so bookings are assigned to a specific barber and availability is calculated per barber.

